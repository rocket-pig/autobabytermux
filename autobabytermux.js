var YOUR_API_KEY = 'set me please';



//Show 'Task:' sub-prompts in output. 
DISPLAY_TASK_PROMPTS = true;

//Show unfiltered responses from API in console? Uglier, but needed for debugging.
DISPLAY_UNFILTERED = true;

//Max allowed requests to the API per Question.  This includes ALL prompts including retries. 
TOTAL_ALLOWED_REQS = 30;

//Max allowed response tokens( token = 'half a word' they say.)  Getting away with smaller responses will make it cheaper to use, but too small and the outputs will be broken
MAX_TOKENS = 200;

//If LLM doesnt follow input request, how many attempts at re-prompting PER STEP do we try before giving up? Note that retries count toward global TOTAL_ALLOWED_REQS.
RETRIES_COUNT = 3;

//Termux-api Plugin. Allowed commands.  (You need to apt install termux-api.)
TERMUX_COMMANDS = ['termux-tts-speak','termux-toast','termux-notification-list', 'termux-sms-list','termux-vibrate'];


//end of settings area.


const { exec } = require('child_process');
const fs = require('fs');
const vm = require('vm');
const readline = require('readline');

var global_history = `Available Plugins:
* Node.js REPL: 
REPL[inputString]
Usage: This is a sandboxed Node.js REPL, it is NOT a bash prompt. There is a single-directory file saving and reading mechanism: fs.readFileSync & fs.writeFileSync are the only fs methods that work, and no '/' dir hierarchy exists. Also, the global ALLOWED_FUNCTIONS array contains a READ-ONLY list of modules in the sandbox.
* Termux-api:
    Usage: Ex:'termux-<command-with-dashes> -d1000' is mapped to termux.command_with_dashes('-d1000') in the REPL. Available commands are listed in termux.available_commands. The methods all return Promises, so .then() chaining is required.
Rules:
Pay attention to command outputs! Each line begins with 'Prefix: ' to signify input type. You will be informed after each step what your next task is. Task history will be listed here:

Question: use termux-api to vibrate the phone.
Observation: The Termux-api available commands are at termux.available_commands.
Thought: I will list the available plugins and look for something appropriate.
Action: REPL[ console.log(termux.available_plugins) ]
Result: 
console.log: termux-tts-speak,termux-toast,termux-notification-list,termux-sms-list,termux-vibrate
stdout:N/A
stderr:N/A
Thought: I can use the command 'termux-vibrate' in the REPL. I dont know its usage but I can check that by calling it with '-h'.
Action: REPL[ termux.vibrate('-h').then(r=>console.log(r)) ]
Result:
console.log: 'Usage: termux-vibrate [-d duration] [-f] Vibrate the device.\n-d duration  the duration to vibrate in ms (default:1000)\n-f force vibration even in silent mode'
stdout:NA
stderr:NA
Thought:I now know how to complete the original Question.
Action.REPL[ termux.vibrate('-d1000').then((r) => {if(r=='')console.log("Phone vibrated!")}) ]
Result:
console.log: Phone vibrated!
stdout: N/A
stderr: N/A
Finished!
-------------Next Question!
Question: `;



async function loadModules() {
  const openaiModule = await import("openai");
  const { Configuration, OpenAIApi } = openaiModule;
  const configuration = new Configuration({
    apiKey: YOUR_API_KEY,
  });
  const openai = new OpenAIApi(configuration);


async function generateOutput(message) {
  const prompt = message.trim();
  let attempts = 0;
  let hasFinished = false;
  let output = null;
  
  while (attempts < 3 && !hasFinished) {
    try {
      attempts++;
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });
      const { choices, error } = response.data;
      if (error) {
        console.log(C_Red,'-------------API Error/Timeout attempt #'+attempts) //:\n',error.message);
      }
      if (Array.isArray(choices)) {
        output = choices[0].message.content.trim();
      } else {
        output = choices.trim();
      }
      hasFinished = true;
    } catch(e) { 
      console.log(C_Red,'-------------API Error/Timeout attempt #'+attempts)
    }
  }

  return output;
}



///....////


//keep generateOutput clean: wrapper with added
//logging/parsing/history prepending/retry/counting/etc.
async function apiReq(message,prefix) {
  //if message begins with 'Task:', post to console:
  if(message.startsWith('Task:') && DISPLAY_TASK_PROMPTS) {
        console.log(C_White,message)
}
  let prompt = global_history + '\n' + message;
  let response;
  let req_count = 0;
  //manage retries
  for (let i = 0; i < RETRIES_COUNT && req_count < TOTAL_ALLOWED_REQS; i++) {
    req_count+=1; i+=1;
    response = await generateOutput(prompt);
    if(DISPLAY_UNFILTERED) console.log(C_BrightBlack, '['+i+']Unfiltered: ' + response+'\n['+i+']')
    const validatedInput = inputValidator(response, prefix);
    if (validatedInput !== null) {
        console.log(C_Yellow,'[ '+req_count+' ] '+prefix+':')
        console.log(C_Green,validatedInput)
        //'action_REPL' logs the code str _after_ extraction, prob rarely ever matters.
        if(prefix != "YesNo" && prefix != 'Action') global_history+='\n'+prefix+': '+ validatedInput
        //console.log('\n>>> ',prefix+': '+ validatedInput)
      return validatedInput;
    } else { 
        console.log(C_BrightBlack,'[ '+req_count+' ] : [ '+prefix+' ] Response Rejected.') } 
  }
  return null;
}


//response validator.
function inputValidator(input, prefix) {
    if (prefix == 'YesNo') {
    const yesNoRegex = /^(yes|no).*?$/i;
    if (yesNoRegex.test(input)) {
      return input.toLowerCase();
    }
    return null;
  } else {
  const prefixes = ['Action', 'Result', 'Thought', 'Question', 'Observation', 'Finish', 'Task'];
  const prefixStr = `${prefix}:`;

  // Check if the input starts with the prefix
  if (!input.startsWith(prefixStr)) {
    return null;
  }

  // Find the index of the next occurrence of a prefix
  let index = input.length;
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i];
    const prefixStr = `${prefix}:`;
    const prefixIndex = input.indexOf(prefixStr, prefixStr.length);
    if (prefixIndex !== -1 && prefixIndex < index) {
      index = prefixIndex;
    }
  }

  // Extract the valid input and trim it
  const result = input.slice(prefixStr.length, index).trim();
  return result.length > 0 ? result : null;
}};


/////
async function action_REPL(command) {
    console.log(C_Blue,'>>>>>>>>>>>>>>>>>>>> Plugin: REPL[]: >>>>>>>>>>>>>>>>>>>>\n');
     
      console.log(C_Blue,'Plugin: REPL[ '+command+' ]:\n')
    
      let evald = await sandbox_run(command);
      
      
      global_history+='\nAction: REPL['+command+']'
      let resultString = '\nResult: \nstdout: ' + (evald.stdout || 'N/A') +
      '\nstderr: ' + (evald.stderr || 'N/A') +
      '\nconsole.log: ' + (evald.v_console || 'N/A')+'\n';
    
      global_history+=resultString
     
      console.log(C_Blue,'>>>>'+resultString+'>>>>');
      console.log(C_Blue,'<<<<<<<<<<<<<<<<<<<< END OF Plugin: REPL[] <<<<<<<<<<<<<<<<<<<<\n')
            
}//end action_REPL
    
//to keep delegator readable
function parseActionStatement(input) {
    try {
        //get Plugin name
        const argsn = /^(.*?)\[/;
        const m2 = argsn.exec(input);
        let actionName;
        if (m2[1] && m2[1].length > 1) {
          actionName = m2[1].trim().toLowerCase();
        } else {
            return null;
        }
        //get Plugin input str. regex abs refuses to cooperate, so we found our own way to get first/last bracket location.
        const lastBracketIndex = input.lastIndexOf("]");
        const firstBracketIndex = input.indexOf("[");
        const actionArgs = input.substring(firstBracketIndex + 1, lastBracketIndex);
        //save to obj
        input = { actionName, actionArgs }
       
        return input;
        
    } catch(e) {
        //console.log('Caught: malformed Action statement, skipping:',e)
        return null;
        }
}//end parseActionStatement



var req_count = 1;
async function delegator(question) {
  let observation;
  let thought;
  let action; 
  let result;
  let unfinished = true;
  let first_pass = true;
  
  while (unfinished && req_count < TOTAL_ALLOWED_REQS) {
    if (!observation) {
      // Step 2: Retrieve an observation
      let p;
      let q = 'Question: '+question+'\n';
      if(first_pass) p= q + 'Task: Create a one-line "Observation: " statement informed by the Question above. Follow the style shown.'
      if(!first_pass) p='Task: Create a one-line "Observation: " statement informed by the history and Result above. Take special note of the above stdout, stderr and console.log outputs. What did you learn? Knowing what you know now, What other way could you approach solving this problem / answering this question?'
      observation = await apiReq(p,'Observation');
    }
    
    if (!thought) {
      // Step 3: Generate a thought about how to take action
      let p='Task: Create a one-line "Thought: " statement informed by your Observation above: how will you solve the problem/question by applying the REPL plugin.'
      thought = await apiReq(p,'Thought');
    }//end Thought
    
    if (!action) {
      // Step 3: Generate action/plugin request.
      let p='Task: Now, create an "Action: " statement informed by your Thought statement above. Syntax: "Action: REPL[ your js code here ]" (without quotes).'// OR 'Search[ your search phrase here ]' (without quotes)."
      action = await apiReq(p,'Action');
    }//end Action
    
    
    if(observation && thought && action) {
        
    // Step 4: Take action using a plugin
    let actionObj = parseActionStatement(action)
    //console.log('\n--------ACTION OBJ:\n',actionObj,'\n----------END ACTION OBJ\n')
    if(actionObj.actionName == 'repl') { 
        result = await action_REPL(actionObj.actionArgs);
    }
    if(actionObj.actionName == 'search') { 
        result = "'Error: Search Plugin deactivated.'"
    } 
    
    // Step 5: Determine if the result answers the question
    
    let p=`Task: Respond with Yes or No. Are all three statements true? 1.Your code completed without error. 2.Your code printed the expected output. 3.You have obtained the necessary information to fully answer the original Question, OR have fully completed the original task. ALL THREE must be true for Yes. Respond with No if there are additional steps needed to complete your task.`
    let prompt = await apiReq(p,'YesNo');

    if (prompt && prompt.toLowerCase().startsWith('yes')) {
        
      // Step 6a: Compose a finish statement
      let p='Task: Provide a "Finish: " statement: your conclusion based on above history, answering the Question in full.'
      action = await apiReq(p,'Finish');
      unfinished = false;
      req_count = 1;
      break;
    } else {
      // Step 6b: Start Again at Thought by deleting Thought & Action & Obs
      first_pass = false;
      observation = null;
      thought = null;
      action = null;
    }
    
    }//end last if clause.
    
  }//end while true
  if(req_count >= TOTAL_ALLOWED_REQS) 
  {
      console.log(C_Red,'Error: Exceeded API request limit. TOTAL_ALLOWED_REQS = '+TOTAL_ALLOWED_REQS+'\n')
      return 1;
  }
}//end function



//run!

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function run() {
    
    process.on('uncaughtException', (err) => {
  console.log('(Un)caught exception:', err);
  console.log('Press Enter to continue or Ctrl-C to exit');
  process.stdin.once('data', () => {});
});

  let inputString = '';
    try{
     inputString = process.argv[2].slice(1, -1).trim();
    } catch(e) {inputString = ''; }  
  virtualFs.init();
  if (inputString != '') {
    await delegator(inputString);
  } else {
      console.log('>>> Welcome. Entering "*s" at any time will switch to VM interpreter. <<<')
    while (true) {
      let input = await new Promise((resolve) => {
        rl.question('Enter Question: ', resolve);
      });
      if(!input.startsWith('*s')) {
      await delegator(input);
      } 
      if(input.startsWith('*s')) {
          console.log("'exit' to exit.")
          while(input != 'exit') {
          //start over till 'exit'
        input = await new Promise((resolve) => {
        rl.question('[vm] >>>  ', resolve);
      });
        let response = await sandbox_run(input)
        console.log(response)
        
    };
      }
    }
  }
  console.log('<<<< Goodbye. <<<<')
  rl.close();
}

run().catch((e) => console.error(e));


}//END loadModules context.
loadModules().catch(error => {
  console.error(`Failed to load modules: ${error}`);
});




/////



//// everything below is sandbox code:
//fakefs area:
function fakefs_do(mode, obj) {
    if (mode === 'put') {
        try {
        let data = {};
        if (fs.existsSync('fakefs.txt')) {
          const content = fs.readFileSync('fakefs.txt', 'utf8');
          data = JSON.parse(content);
        }
        data = {...obj, ...data};
        const content = JSON.stringify(data);
        fs.writeFileSync('fakefs.txt', content);
        return 'success';
        } catch(e) { 
            sandbox.v_stdout="";
            sandbox.v_stderr='Error: "'+Object.keys(obj)+'" save FAILED.\n'
        }
    } else if (mode === 'get') {
      try {
    const content = fs.readFileSync('fakefs.txt', 'utf-8');
    return JSON.parse(content);
      } catch(e) { console.log("Could not load fakefs.txt, (returning empty object): ",e)
        return {} }; 
  } else {
    throw new Error('Invalid mode: ' + mode);
  }
};



//cheap virtual fs so Agent can have persistent
//'files' in memory:
var virtualFs = {
  files: {},
  readFileSync: function (path, options) {
    if(path.includes('/')) {sandbox.v_stderr+="Error: No paths allowed in single-dir filesystem. use filename.ext only."; return;}
    this.files = fakefs_do('get',this.files);
    const file = this.files[path];
    if (!file) {
      sandbox.v_stderr+=`ENOENT: no such file or directory, open '${path}'\n`
      return null;
    } 
    return file; 
   
  },
  writeFileSync: function (path, data, options) {
      if(path.includes('/')) {sandbox.v_stderr+="Error: No paths allowed in single-dir filesystem. use filename.ext only."; return;}
    this.files[path] = data;
    let retval = fakefs_do('put',this.files);
    if(retval == 'success') {
        sandbox.v_stdout+='"'+path+'" saved successfully.\n';  
        }
    },
  init: function() {
//attach error messages to every other fs method:
for (const method in fs) {
  if (method !== 'readFileSync' && method !== 'writeFileSync' && typeof fs[method] === 'function') {
    sandbox.fs[method] = function(...args) {
      sandbox.v_stderr+='Error: "fs.' + method + '" method is not available in sandbox. Available "fs" methods: [ "fs.readFileSync", "fs.writeFileSync" ]\n';
    }
  }
};
}
}; //end virtualFs


//termux-<command> Plugin. Gets allowed commands from array in settings area.
const termux = {available_commands:[...TERMUX_COMMANDS]};

for (const cmd of TERMUX_COMMANDS) {
    const propName = cmd.replace(/termux-/, '').replace(/-/g, '_');
  termux[propName] = async function (...args) {
    let command = cmd;
    if (args.length > 0) {
        command += ` ${args.join(' ')}`;
    }
    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  };
}

//sandhox 'vm'. anything not listed in allowedFunctions will refuse to import (in a way that the LLM can see AND doesnt crash the vm or the script.)

//sandbox config:
const allowedFunctions = ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate', 'Buffer', 'crypto', 'http', 'https', 'querystring', 'string_decoder', 'util', 'zlib', 'stream', 'tls', 'net', 'dgram', 'os', 'path', 'url', 'punycode', 'string_decoder', 'tty', 'constants', 'vm', 'Math'];

    //allow AA to list whats allowed so we dont have to watch it try/fail 100 ways in the dark(hopefully). Edit: no its still an idiot and will try stuff that doesnt work endlessly and never check this list. Not sure how to prompt it to..? seek dox in the environment? TODO.
    const ALLOWED_FUNCTIONS = [...allowedFunctions];

    const sandbox = {
    ...global,
    ALLOWED_FUNCTIONS,
    termux,
    fs: {
    readFileSync: function(path, options) {
      virtualFs.readFileSync(path, options);
    },
    writeFileSync: function(path, data, options) {
      callback = virtualFs.writeFileSync(path, data, options)
    }
    },
    v_stdout: "",
    v_stderr: "",
    v_console: "",
    console: { 
    log: (...args) => { 
      sandbox.v_console += args.join(' ') +'\n';
    },
    error: (...args) => { 
      sandbox.v_stderr += args.join(' ') +'\n'; 
    }
    },
    process: Object.assign({}, process, {
    stdout: {
      write: (chunk, encoding='utf8', callback) => {
        sandbox.v_stdout += chunk.toString();
        if (callback) {
          callback();
        }
      }
    },
    stderr: {
      write: (chunk, encoding='utf8', callback) => {
        sandbox.v_stderr += chunk.toString(encoding);
        if (callback) {
          callback();
        }
      }
    }
  }),
    require: function(moduleName){
    if(moduleName !== 'fs') {//fake fs override
    if (!allowedFunctions.includes(moduleName) ) {
      sandbox.v_stderr+=`Import Error: Module "${moduleName}" is not allowed in this sandbox.`;
    }
    return require(moduleName);
  }else { return sandbox.fs }},
    module: module,
    exports: typeof exports !== 'undefined' ? exports : {},
    __dirname: typeof __dirname !== 'undefined' ? __dirname : "",
    __filename: typeof __filename !== 'undefined' ? __filename : "",
  };

  for (const func of allowedFunctions) {
      if(func != 'fs') {
     sandbox[func] = global[func];
      }
  }


//sandbox shared/reused instance
var vm_instance = vm.createContext(sandbox)




async function sandbox_run(code){
//reset output logs    
sandbox.v_stdout="";
sandbox.v_stderr="";
sandbox.v_console="";

//catch vm throws INSIDE vm so LLM can see them.
//the [0] & [1] prefix is to help see where things were thrown.
try {
code = `
try {
    ${code}
} catch (e)
 { process.stderr.write('[0]'+e);
 };
`;

// Execute the code in the vm context
await vm.runInContext(code,vm_instance);

// Wait for 100ms to allow time for the output to be captured
  await new Promise(resolve => setTimeout(resolve, 100));


} catch (error) {
    console.log('[1] Sandbox Error: Caught: ',error)
    if(typeof sandbox.v_console == 'undefined') sandbox.v_console = 'NA';
    if(typeof sandbox.v_stderr == 'undefined') sandbox.v_stderr = 'NA';
    return { stderr: error.toString(), v_console: sandbox.v_console, stdout:sandbox.v_stdout };
  }

//not caught, so
//we pass results 'up'.
v_console = sandbox.v_console || 'N/A.'
v_stdout = sandbox.v_stdout || 'N/A.'
v_stderr = sandbox.v_stderr || 'N/A.'

//why does console response often(perhaps always?) start with 'undefined'? dont care moving on
if(typeof v_console == 'string' && v_console.startsWith('undefined')) v_console = v_console.substring(9)

return {
     v_console: v_console,
     stdout: v_stdout,
     stderr: v_stderr
 }
 
}//END of sandbox context





//assign console colors to
// 'C_<color>' for easy use in logging
function assignConsoleColors() {
  const consoleColors = {
    Black: '\x1b[30m%s\x1b[0m',
    Red: '\x1b[31m%s\x1b[0m',
    Green: '\x1b[32m%s\x1b[0m',
    Yellow: '\x1b[33m%s\x1b[0m',
    Blue: '\x1b[34m%s\x1b[0m',
    Magenta: '\x1b[35m%s\x1b[0m',
    Cyan: '\x1b[36m%s\x1b[0m',
    White: '\x1b[37m%s\x1b[0m',
    BrightBlack: '\x1b[90m%s\x1b[0m',
    BrightRed: '\x1b[91m%s\x1b[0m',
    BrightGreen: '\x1b[92m%s\x1b[0m',
    BrightYellow: '\x1b[93m%s\x1b[0m',
    BrightBlue: '\x1b[94m%s\x1b[0m',
    BrightMagenta: '\x1b[95m%s\x1b[0m',
    BrightCyan: '\x1b[96m%s\x1b[0m'
  };

  for (const color in consoleColors) {
    if (consoleColors.hasOwnProperty(color)) {
      global[`C_${color}`] = consoleColors[color];
    }
  }
  return consoleColors;
}; assignConsoleColors()




