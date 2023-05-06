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

//end of settings area.


const fs = require('fs');
const vm = require('vm');
const readline = require('readline');

/*
Not yet Available plugins:
Google Search:
Result = Search[phrase]
*/
var global_history = `
Available Plugins:
Node.js REPL:
Result = REPL[inputString]
NOTE: This is the Node.js REPL, it is NOT a bash prompt. fs.readFile & fs.writeFile are the only fs methods allowed. The global ALLOWED_FUNCTIONS array contains a list of what other modules are available in the sandbox.
Each line begins with keyword to signify which. Input MUST be on a single line or will get truncated, especially when using plugins.
[BEGIN]
Question: Get local file stats.html, print to screen
Observation: I need to read and extract data from a file.
Thought: I can use Node.js to read the file and extract the data, then format it for printing.
Action: REPL[ const fs = require('fs'); const data = fs.readFileSync('stats.html', 'utf8'); const regex = /<td class="stats">([\d,]+)<\/td>/g; let match; while ((match = regex.exec(data)) !== null) { console.log(match[1].replace(/,/g, '')); } ]
Result: stdout: NA stderr: NA console.log: 0. Sandbox Error: Error: Use fs.readFile. fs.readFileSync not enabled in sandbox.
Observation: The REPL is giving me an error because it doesn't allow the use of fs.readFileSync for security reasons.
Thought: I can modify my code to use fs.readFile instead.
Action: REPL[ const fs = require('fs'); fs.readFile('stats.html', 'utf8', (err, data) => { if (err) throw err; const regex = /<td class="stats">([\d,]+)<\/td>/g; let match; while ((match = regex.exec(data)) !== null) { console.log(match[1].replace(/,/g, '')); } }); ]
Result: stdout: NA stderr: NA console.log: NA
Observation: Nothing printed out. I must keep trying until I succeed. I will try revising my code.
Action: REPL[ const fs = require('fs'); fs.readFile('stats.html', 'utf8', (err, data) => { if (err) throw err; console.log(data)}); ]
Result: stdout: NA stderr: NA console.log:<html> 42 16 28.8 96K 10LARGE </html>
Observation: The code did not error and output is as expected. This completes what I was asked to do.
Finish: I have printed the requested file, stats.html, to the console.
Question: `;


//begin loadModules context
async function loadModules() {
      const openaiModule = await import("langchain/chat_models/openai");
  const schemaModule = await import("langchain/schema");
  const { ChatOpenAI } = openaiModule;
  const { HumanChatMessage, SystemChatMessage } = schemaModule;
  const chat = new ChatOpenAI({ openAIApiKey: YOUR_API_KEY, temperature: 0.7, timeout: 50000 });


async function generateOutput(message) {
  let response = await chat.call([
    new HumanChatMessage(message, {max_tokens: MAX_TOKENS})
  ]); 
    //this method decided to only sometimes return an obj with a .text atribute, and wen it feels like it, just returns a han solo string with no JSON at all. So, :
    if (typeof response === 'object') {
       response = response.text.trim() || response.error.trim();
    } else {
       response = response.trim();
    }
    return response;
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
  //manage retries
  for (let i = 0; i < RETRIES_COUNT && req_count < TOTAL_ALLOWED_REQS; i++) {
    req_count+=1;
    response = await generateOutput(prompt);
    if(DISPLAY_UNFILTERED) console.log(C_BrightBlack, '['+i+']Unfiltered: ' + response+'\n['+i+'] END Unfilitered Output -----------\n');
    const validatedInput = inputValidator(response, prefix);
    if (validatedInput !== null) {
        console.log(C_Yellow,'[ '+req_count+' ] '+prefix+':')
        console.log(C_Green,validatedInput)
        global_history+='\n'+validatedInput
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
    
      let evald = await sandbox_run(command);
      
      global_history+='\nAction: REPL['+command+']'
      let resultString = '\nResult: stdout: ' + (evald.stdout || 'N/A') +
      '\nstderr: ' + (evald.stderr || 'N/A') +
      '\nconsole.log: ' + (evald.v_console || 'N/A')+'\n';
    
      global_history+=resultString
      
      console.log(C_Blue,'Plugin: REPL[ '+command+' ]:\n')
      console.log(C_Blue,'>>>>'+resultString+'>>>>');
      console.log(C_Blue,'<<<<<<<<<<<<<<<<<<<< END OF Plugin: REPL[] <<<<<<<<<<<<<<<<<<<<\n')
            
}//end action_REPL
    
//to keep delegator readable
function parseActionStatement(input) {
    try {
        //get Plugin name
        const argsn = /^(.*?)\[/;
        const m2 = argsn.exec(input);
        const actionName = m2[1].trim().toLowerCase();
        //get Plugin input str. regex abs refuses to cooperate, so we found our own way to get first/last bracket location.
        const lastBracketIndex = input.lastIndexOf("]");
        const firstBracketIndex = input.indexOf("[");
        const actionArgs = input.substring(firstBracketIndex + 1, lastBracketIndex);
        //save to obj
        input = { actionName, actionArgs }
        
        //console.log('Parser Debug: input is:',JSON.stringify(input))
        
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
      if(first_pass) p='Task: Create a one-line "Observation: " statement informed by the Question above. Follow the style shown.'
      if(!first_pass) p='Task: Create a one-line "Observation: " statement informed by the history and Result above. What other way could you approach solving this problem / answering this question?'
      observation = await apiReq(q+p,'Observation');
    }
    
    if (!thought) {
      // Step 3: Generate a thought about how to take action
      let p='Task: Create a one-line "Thought: " statement informed by your Observation above: how will you solve the problem/question by applying the REPL plugin.'
      thought = await apiReq(p,'Thought');
    }//end Thought
    
    if (!action) {
      // Step 3: Generate action/plugin request.
      let p='Task: Now, create an "Action: " statement informed by your Thought statement above. Syntax: "Action: REPL[ your js code here no line breaks ]" (without quotes).'// OR 'Search[ your search phrase here ]' (without quotes)."
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
    
    let p=`Task: Respond with Yes or No. Are all these things true? 1. Your code completed without error 2. Your code printed the expected output 3. You are now prepared to answer the question.  ALL THREE must be true for Yes.: `
    let prompt = await apiReq(p,'YesNo');

    if (prompt && prompt.toLowerCase().startsWith('yes')) {
        
      // Step 6a: Compose a finish statement
      let p='Task: Provide a comprehensive "Finish: " statement: your conclusion based on above history, answering the Question in full.'
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
  let inputString = process.argv[2];
  inputString = inputString.slice(1, -1);
  virtualFs.init();
  if (inputString) {
    await delegator(inputString);
  } else {
    while (true) {
      inputString = await new Promise((resolve) => {
        rl.question('Enter Question: ', (input) => {
          resolve(input);
        });
      });
      await delegator(inputString);
      rl.close();
    }
  }
}; run().catch(e=>console.error(e));

}//END loadModules context.
loadModules().catch(error => {
  console.error(`Failed to load modules: ${error}`);
});




/////



//// everything below is sandbox code:
//fakefs area:
//persist the fakefs? 
function fakefs_do(mode, obj) {
    if (mode === 'put') {
        let data = {};
        if (fs.existsSync('fakefs.txt')) {
          const content = fs.readFileSync('fakefs.txt', 'utf8');
          data = JSON.parse(content);
        }
        data = {...data, ...obj};
        const content = JSON.stringify(data);
        fs.writeFileSync('fakefs.txt', content);
    } else if (mode === 'get') {
      try {
    const content = fs.readFileSync('fakefs.txt', 'utf-8');
    return JSON.parse(content);
      } catch(e) { console.error("Could not load fakefs.txt, (returning empty object): ",e)
        return {} }; 
  } else {
    throw new Error('Invalid mode: ' + mode);
  }
};

//cheap virtual fs so Agent can have persistent
//'files' in memory:
var virtualFs = {
  files: {},
  readFile: function (path, options, callback) {
    if(path.startsWith('./')) path = path.substring(2)
    this.files = fakefs_do('get',this.files) //persist fakefs
    const file = this.files[path];
    if (!file) {
      return callback(new Error(`ENOENT: no such file or directory, open '${path}'`));
    }
    callback(null, options.encoding ? file.toString(options.encoding) : file);
  },
  writeFile: function (path, data, options, callback) {
      if(path.startsWith('./')) path=path.substring(2)
    this.files[path] = options.encoding ? Buffer.from(data, options.encoding) : data;
    fakefs_do('put',this.files) //persist fakefs. 
    callback();
  },
  init: function() {
//attach error messages to every other fs method:
for (const method in fs) {
  if (method !== 'readFile' && method !== 'writeFile' && typeof fs[method] === 'function') {
    sandbox.fs[method] = function(...args) {
      console.log('Error: ' + method + ' method is not available in sandbox. Available methods: [ fs.readFile, fs.writeFile ]')
    }
  }
};
}
}; //end virtualFs



//sandhox 'vm'. anything not listed in allowedFunctions will refuse to import (in a way that the LLM can see AND doesnt crash the vm or the script.)

//sandbox config:
const allowedFunctions = ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate', 'Buffer', 'process', 'crypto', 'http', 'https', 'querystring', 'string_decoder', 'util', 'zlib', 'stream', 'tls', 'net', 'dgram', 'os', 'path', 'url', 'punycode', 'string_decoder', 'tty', 'constants', 'vm', 'Math'];

    //allow AA to list whats allowed so we dont have to watch it try/fail 100 ways in the dark(hopefully)
    const ALLOWED_FUNCTIONS = [...allowedFunctions];

    const sandbox = {
    ...global,
    ALLOWED_FUNCTIONS,
    fs: {
    readFile: function(path, options, callback) {
      virtualFs.readFile(path, options, callback);
    },
    writeFile: function(path, data, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      virtualFs.writeFile(path, data, options, callback);
    }
  },
    v_stdout: "",
    v_stderr: "",
    v_console: "",
    console: { 
    log: (...args) => { 
      sandbox.v_console += args.join(' ') + '\n'; 
    } }, 
    process: {
    stdout: {
      write: (chunk, encoding, callback) => {
        sandbox.v_stdout += chunk.toString();
        if (callback) {
          callback();
        }
      }
    },
    stderr: {
      write: (chunk, encoding, callback) => {
        sandbox.v_stderr += chunk.toString();
        if (callback) {
          callback();
        }
      }
    }
  },
    require: function(moduleName){
    if(moduleName != 'fs') {//fake fs override
    if (!allowedFunctions.includes(moduleName) ) {
      throw new Error(`Module "${moduleName}" is not allowed in this sandbox.`);
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
//the 0. & 1. prefix is to help see where things were thrown.
try {
code = `
try {
    ${code}
} catch (e)
 { console.log('0. Sandbox Error:', e);
 };
`;

// Execute the code in the vm context
let nerp = await vm.runInContext(code,vm_instance);

} catch (error) {
    console.log('1. Sandbox Error: Caught: ',error)
    if(typeof v_console == 'undefined') v_console = 'NA';
    if(typeof v_stderr == 'undefined') v_stderr = 'NA';
    return { v_stdout: error.toString().slice(0, 150) + '[...]', v_console, v_stderr };
  }

//the way we pass results 'up'.
v_console = sandbox.v_console || 'NA'
v_stdout = sandbox.v_stdout || 'NA'
v_stderr = sandbox.v_stderr || 'NA'

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




