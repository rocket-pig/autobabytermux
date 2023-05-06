var YOUR_API_KEY = 'set me please';

// How many times can chain-of-thought
// iterate autonomously? 
const total_allowed_loops = 10;

var pp1= `
Available plugins:
Google Search:
Result = Search[phrase]
Node.js REPL:
Result = REPL[inputString]
NOTE: This is the Node.js REPL, it is NOT a bash prompt. fs.readFile & fs.writeFile are the only fs methods allowed.
Each line begins with keyword to signify which. Input MUST be on a single line or will get truncated, especially when using plugins.
[BEGIN]
Question: Get local file stats.html, print to screen
Observation: I need to read and extract data from a file.
Thought: I can use Node.js to read the file and extract the data, then format it for printing.
Task: Create a Action statement that utilizes a plugin (search,repl) in order to help answer the question.
Action: REPL[ const fs = require('fs'); const data = fs.readFileSync('stats.html', 'utf8'); const regex = /<td class="stats">([\d,]+)<\/td>/g; let match; while ((match = regex.exec(data)) !== null) { console.log(match[1].replace(/,/g, '')); } ]
Result: stdout: NA stderr: NA console.log: 0. Sandbox Error: Error: Use fs.readFile. fs.readFileSync not enabled in sandbox.
Observation: The REPL is giving me an error because it doesn't allow the use of fs.readFileSync for security reasons.
Thought: I can modify my code to use fs.readFile instead.
Task: Create a Action statement that utilizes a plugin (search,repl) in order to help answer the question.
Action: REPL[ const fs = require('fs'); fs.readFile('stats.html', 'utf8', (err, data) => { if (err) throw err; const regex = /<td class="stats">([\d,]+)<\/td>/g; let match; while ((match = regex.exec(data)) !== null) { console.log(match[1].replace(/,/g, '')); } }); ]
Result: stdout: NA stderr: NA console.log: NA
Observation: Nothing printed out. I must keep trying until I succeed. I will try revising my code.
Task: Create a Action statement that utilizes a plugin (search,repl) in order to help answer the question.
Action: REPL[ const fs = require('fs'); fs.readFile('stats.html', 'utf8', (err, data) => { if (err) throw err; console.log(data)}); ]
Result: stdout: NA stderr: NA console.log:<html> 42 16 28.8 96K 10LARGE </html>
Observation: This completes what I was asked to do.
Observation: I could have been faster by trying the simpler way first. I will be faster next time.
Finish: I have printed the requested file, stats.html, to the console.
Question: `



const fs = require('fs');
const vm = require('vm');


// `tail -f autobabytermux_log.txt` for 
// a slightly more verbose
// look at reasoning / repl vm noise
var logfile = 'autobabytermux_log.txt'
prune_log(logfile) //prunes to < 1K lines.
function flog(...args) {
  const str = args.join(' ')+'\n';
  fs.appendFileSync(logfile, str);
}



//begin loadModules context
async function loadModules() {
      const openaiModule = await import("langchain/chat_models/openai");
  const schemaModule = await import("langchain/schema");
  const { ChatOpenAI } = openaiModule;
  const { HumanChatMessage, SystemChatMessage } = schemaModule;
  const chat = new ChatOpenAI({ openAIApiKey: YOUR_API_KEY, temperature: 0.7, timeout: 50000 });
  



async function generateOutput(message) {
  let response = await chat.call([
    new HumanChatMessage(message, {max_tokens: 500})
  ]); 
    if (typeof response === 'object') {
        flog('response is: an obj')
      response = response.text;
    } else {
        flog('response is: a str')
      response = response;
    }
    return response;
}


//uncomment for a lot of debug noise in CLI.
function vlog(...args) {
    //youll wish you hadnt:
    //console.log(...args);
}



 //to summarize it takes the garble that LLM returns, strips it of newlines and then splits it by the 5 possible prefixes into a obj/dict with keys=prefixes and values=whatever text came between that prefix and the next, OR the end of the input.
 
 function convertToObj(text) {
  // Replace all newlines with spaces
  const cleanedText = text.replace(/\n/g, ' ');
  
  // Split the text into segments based on the five potential prefixes
  const segments = cleanedText.split(/(Action:|Result:|Thought:|Question:|Observation:|Finish:)/g).filter(segment => segment.length > 0);
  
  // Initialize an object to store the parsed data
  const parsedData = {
    Action: '',
    Result: '',
    Thought: '',
    Question: '',
    Observation: '',
    Finish: ''
  };
  
// Iterate over the segments and assign them to the appropriate key in the parsed data object
let currentKey = null;
for (let i = 0; i < segments.length; i++) {
  const segment = segments[i];
  if (['Action:', 'Result:', 'Thought:', 'Question:', 'Observation:','Finish:'].includes(segment)) {
    // This segment is a prefix; update the current key
    currentKey = segment.replace(':', '');
  } else if (typeof segment !== 'undefined') {
    // This segment is content; assign it to the current key
    if (parsedData[currentKey] === '') {
      parsedData[currentKey] = segment.trim();
    }
    let nextIndex = i + 1;
    while (nextIndex < segments.length && ['Action:', 'Result:', 'Thought:', 'Question:', 'Observation:','Finish:'].indexOf(segments[nextIndex]) === -1) {
      nextIndex++;
    }
    i = nextIndex - 1;
  }
}
  
  // Trim any trailing spaces from the parsed data values
  for (const key in parsedData) {
    parsedData[key] = parsedData[key].trim();
  }



///  
let obj = parsedData
    
flog('\n---new parser object:------------\n',JSON.stringify(obj),'\n--------end new parser object------------\n')


if ('Action' in obj) {
        try {
            //get Plugin name
            const argsn = /^(.*?)\[/;
            const m2 = argsn.exec(obj.Action);
            const actionName = m2[1];
            //get Plugin input str. regex abs refuses to cooperate, so we found our own way to get first/last bracket location.
            const lastBracketIndex = obj.Action.lastIndexOf("]");
            const firstBracketIndex = obj.Action.indexOf("[");
            const actionArgs = obj.Action.substring(firstBracketIndex + 1, lastBracketIndex);
            //save to obj
            obj.Action = { actionName, actionArgs }
            
            flog('Parser Debug: obj.Action is:',JSON.stringify(obj.Action))
            
            //if legit action statement, del everything else. we dont need to 'hear' hallucinated results.
            if(actionName.toLowerCase() == 'repl' || actionName.toLowerCase() == 'search') {
                for (let key in obj) {
                     if (key !== 'Action') {
                    delete obj[key];
                    }
                    }

                }
        } catch(e) {
            flog('Caught: malformed Action statement, skipping:',e)
            }
}


for (let key in obj) { if (!obj[key]) { delete obj[key]; }} //delete cruft


if ('Finish' in obj) {
        if (!obj.Action && !obj.Result && !obj.Thought && !obj.Observation && hasHad.Action) { // Only assign Finish if solo, AND if Action has been taken (toggled in 'hasHad.Action')
            //do nothing, else:
        } else {
          delete obj.Finish
          flog('(Deleted Finish as result was invented - Result not yet provided.)');
        }
    }


flog('\n---parser obj AFTER action parse:------------\n',JSON.stringify(obj),'\n--------end action parsing------------\n')



return obj;
}



//globals because scope inside multinested 'while'...its too miserable.
hasHad = {} // 'hasHad.Action' etc.
var isFinished = false;
var count =0;
var response = ""; var output = "";
var newprompt;
var preprompt = pp1;


//new prompt loop. directly request a specific
//reaction to previous prompt.
var currentPrefix = 'Question';
async function generatePrompt(previousPrefix) {
  const prefixes = ['Question','Observation', 'Thought', 'Action', 'Finish'];
  const currentIndex = prefixes.indexOf(previousPrefix);
  
  
//move the global forward each time thru
  currentPrefix = (currentIndex + 1 < prefixes.length) ? prefixes[currentIndex + 1] : 'Question';
  
  let prompt;

  if (previousPrefix === 'Action' && hasHad.Action) {
      let tmp = `\nTask: Respond with Yes or No. Has the given Question been answered and the problem solved?: `
    output+=tmp
    prompt = await generateOutput(output+tmp);
    output+=prompt+'\n'
    console.log(C_BrightBlack,tmp);console.log(C_Green,': '+prompt);

    if (prompt.toLowerCase().startsWith('yes')) {
      currentPrefix = 'Finish';
      prompt =`\nTask: Create a Finish statement by fully answering the question, including all relevant info from the actions above.`;
    } else if (prompt.toLowerCase().startsWith('no') ) {
        currentPrefix = 'Thought'
      prompt = `\nTask: Create a Thought statement informed by 'Result' information above. What other way could you approach solving this problem / answering this question?`;
    }
  }
  if(previousPrefix === 'Action' && !hasHad.Action || previousPrefix === 'Thought')
 {
      prompt = `\nTask: Create a Action statement that utilizes a plugin (search,repl) in order to help answer the question.`;
} else {
      
    prompt = `Task: Create a one-line ${currentPrefix} statement informed by the ${previousPrefix} statement above. Follow the style shown.`;
  }
return prompt;
}




//8// chat on a loop until ctrl-c //8//
function chatloop() {
    flog('length:',pp1.length)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log("WELCOME! Usage: Preface prompt with [p] to use chain-of-thought preprompt. Otherwise no preprompt will be used.")
    
    rl.prompt()
    
    rl.on('line', async (input) => {
    //new: interact directly with the sandbox
    //by prefacing with [s]:
    if(input.startsWith('[s]')) {
        //remove '[s]'
      let temp = input.trim().slice(3).trim();
      //console.log('got temp:',temp)
        let response = await sandbox_run(temp)
        console.log(response)
    };
        
        
    if(input.startsWith('[p]')) {
        let responseObj;
        virtualFs.init();
        flog('virtualFs:',JSON.stringify(virtualFs),'\n\n\n\n\n')
      //troubleshoot shortcut [remove me]    
      if(input.length == 3) { input = '[p] Read journal.txt. Summarize what youve read. Is it factual? Prove it true or false using your own methods. Then, based on what youve learned, APPEND a new entry to your journal.txt with current time and date' }
      
      /*"[p] create a script you can run via import that simply reads a file in the current directory and prints it to console.log. save this at read.js and test it on itself." }
      */
      
      //remove '[p]'
      newprompt = pp1 + input.trim().slice(3).trim()+"\n";
      //console.log('prompt is:',newprompt)
      
/* /\/\/\/\ while loop /\/\/\/\/ */
      while (!isFinished && count < total_allowed_loops) { // 'Finish' element exits us. 
        
        response="";
        flog('\n--------['+count+'] visible prompt/conversation history (preprompt not shown) is:\n'+input+output+'\n[/end prompt '+count+']----------\n')
        flog('['+count+'] iteration begin: calling api... 0_0')
        
        
        //new prompt routine? this used to just be the one line at the end.

        
        let sequentialprompt = await generatePrompt(currentPrefix)
        
        console.log('\n',sequentialprompt,'\n')
        
        //the actual get
        response = await generateOutput(newprompt+sequentialprompt);
        
        // end new prompt routine.
        
         flog('--------response BEFORE parsing: (usually contains hallucinated results/finish statements etc.)--------\n\n'+response+'\n\n------end of response PRIOR to parsing.-------\n')
         
        //send to parser
        let responseObj = convertToObj(response)
        
          //if Finish made it thru convertToObj parser, shows over:
          if(responseObj && 'Finish' in responseObj && hasHad.Action) {
              console.log(C_Green,'Finish: '+
                responseObj.Finish);
              isFinished = true; // set flag to exit loop
              break;
            }
            
          //otherwise, loops not over:
          if('Observation' in responseObj) {
              currentPrefix = 'Observation'
              hasHad.Observation = true
              output+='\nObservation: '+responseObj.Observation
              console.log(C_BrightBlack,'Observation: '+responseObj.Observation);
          }
          else if('Thought' in responseObj && hasHad.Observation) {
              currentPrefix = 'Thought'
              hasHad.Thought = true
              output+='\nThought: '+responseObj.Thought
              console.log(C_BrightBlack,'Thought: '+responseObj.Thought);

          }
          
          else if('Action' in responseObj && hasHad.Thought) {
           let action = responseObj['Action']
           if(typeof action == 'object' && action.actionName) {
              action.actionName = action.actionName.toLowerCase();
            //dont go further on invented plugin names:
            if(action.actionName == 'repl' || action.actionName == 'search') {
                //Refuse to accept Finish if the agent has never taken an Action. 
                  hasHad.Action = true;
                  
              if(action.actionName == 'repl') {
                  currentPrefix = 'Action'
              console.log(C_Blue,'>>>>>>>>>>>>>>>>>>>> Plugin: REPL[]: >>>>>>>>>>>>>>>>>>>>\n')
              
                  let evald = await sandbox_run(action.actionArgs)
                  
                  flog('\n----sandboxed VM Output:\n',JSON.stringify(evald),'\n--- END VM-----\n')
                  
                  output+='\nAction: REPL['+action.actionArgs+']'
                  let resultString = '\nResult: stdout: ' + (evald.stdout || 'N/A') +
                  ' stderr: ' + (evald.stderr || 'N/A') +
                  ' console.log: ' + (evald.v_console || 'N/A')+'\n';

                  output+=resultString
                  
                  console.log(C_Blue,'Plugin: REPL[ '+action.actionArgs+' ]:\n')
                  console.log(C_Blue,'>>>>'+resultString+'>>>>');
                    console.log(C_Blue,'<<<<<<<<<<<<<<<<<<<< END OF Plugin: REPL[] <<<<<<<<<<<<<<<<<<<<\n')
                        
              }
              //implement me
              if(action.actionName == "search"){
                  console.log("WARN: Search called, but search not implemented");
                  output+='\nAction: Search['+action.actionArgs+']'
                  output += 'Result: ' + '"Sorry, Search is offline."';
              }
            }
            }
          }
        

         //build next pass
        
        //flog('back at PROMPT BUILDING, VAR output IS NOW:', output)
        console.log('['+count+']')
          newprompt = pp1+ input + output+'\n\n{';
          count+=1
      } //end while, and below, if '[p]'
        
    }
    if(!input.startsWith('[s]') && !input.startsWith('[p]')) {
        //no preprompt, regular chat.
        response = await generateOutput(input);  
        console.log(C_Green,response);
    }
    //allow [p] to work again.
    isFinished = false; output = ""; count=0; hasHad = {}; currentPrefix = 'Question'
    });
    //ctrl-c = bye
    rl.on('SIGINT', () => {
      rl.close();
    });
} 
chatloop()




}//END
loadModules().catch(error => {
  console.error(`Failed to load modules: ${error}`);
});



//fakefs area:
//persist the fakefs? 
function fakefs_do(mode, obj) {
  if (mode === 'put') {
    const content = JSON.stringify(obj);
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
      console.log('Error: ' + method + ' method is not available in sandbox. Available methods: [ fs.readFile, fs.writeFile ]');
    }
  }
};
}
}; //end virtualFs



//sandhox 'vm'. anything not listed in allowedFunctions will refuse to import (in a way that the LLM can see AND doesnt crash the vm or the script.)

//sandbox config:
const allowedFunctions = ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate', 'Buffer', 'process', 'crypto', 'http', 'https', 'querystring', 'string_decoder', 'util', 'zlib', 'stream', 'tls', 'net', 'dgram', 'os', 'path', 'url', 'punycode', 'string_decoder', 'tty', 'constants', 'vm', 'Math'];

    const sandbox = {
    ...global,
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
vm.runInContext(code,vm_instance);

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


//keep logfile size in control.  
function prune_log(logfile) {
    const MAX_LINES = 1000;

if (!fs.existsSync(logfile)) {
  fs.writeFileSync(logfile, '');
}

fs.readFile(logfile, 'utf8', (err, data) => {
  if (err) throw err;

  const lines = data.trim().split('\n');

  if (lines.length > MAX_LINES) {
    const newLines = lines.slice(lines.length - MAX_LINES).join('\n');
    fs.writeFile(logfile, newLines, (err) => {
      if (err) throw err;
      console.log('Log file trimmed to 1000 lines.');
    });
  }
});
}  


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
