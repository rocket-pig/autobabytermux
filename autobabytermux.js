
var YOUR_API_KEY_HERE = "YUP THAT ONE"

var oldpp1 = `
Available plugins:
Search[phrase] (Google search)
REPL[inputString] (node.js eval)
Hint: console.log() inside REPL != return()
Rules: 1. Please respond in valid JSON only. 2. Finish response will only be accepted if sent alone with no other elements.
Task: Answer Question using  O, T, A which means Observation, Thought, Action. When ready to answer, finish with {"Finish": "<explanation>"}. Finish will ONLY BE ACCEPTED IF SENT ALONE.
[BEGIN]
Human:
  Question: Write a function that calculates the area of a circle with radius 5 and output the result.
AI: 
  {"Observation": "I'm being asked to do math.",
"Thought": "I can use the REPL to answer this.",
"Action": "REPL[function calculateArea(radius) { return Math.PI * radius * radius; } calculateArea(5);]"}
Plugin REPL:
  Result: 78.53981633974483
AI:
  {"Finish": "The function to calculate the area of a circle with a given radius is: \`function calculateArea(radius) { return Math.PI * radius * radius; }; calculateArea(5);\`"}
Human: 
  Question: `


var pp1 = `
Available plugins:
Google Search:
Result = Search[phrase]
Node.js REPL:
Result = REPL[inputString]
NOTE: Printing to sdout or console will NOT return anything to Result.
Rules: All responses follow the same flow: Observation, Thought, Action, (these three repeated if necessary), and finally Finish.
Each line begins with to signify which.
[BEGIN]
Question: Write a function that calculates the area of a circle with radius 5 and output the result.
Observation: I'm being asked to do math.
Thought: I can use the REPL to answer this.
Action: REPL[function calculateArea(radius) { return Math.PI * radius * radius; } calculateArea(5);]
Result: 78.53981633974483
Finish: The function to calculate the area of a circle with a given radius is: \`function calculateArea(radius) { return Math.PI * radius * radius; }; calculateArea(5);\`
Question: Does Margaret Thatcher really weigh less than two hamhocks? 
Thought: I need to find out Margaret Thatcher's weight and the weight of two hamhocks.
Action: Search[Margaret Thatcher weight]
Result: Margaret Thatcher's weight was known to be around 130 pounds.
Action: Search[weight of 1 hamhock]
Result: average hamhock weight 10 lbs
Observation: Hamhocks weigh around 10 pounds.
Thought: I can calculate now.
Action: REPL[const hamhockWeight = 10; const totalHamhockWeight = hamhockWeight * 2; const isLighter = 130 < totalHamhockWeight; isLighter;]
Result: false
Observation: The output is false, which means Margaret Thatcher weighs more than two hamhocks.
Finish: The comparison between Margaret Thatcher's weight and two hamhocks shows that she weighs more: \`const hamhockWeight = 10; const totalHamhockWeight = hamhockWeight * 2; const isLighter = 130 < totalHamhockWeight; isLighter;\`
Question: `

var appended_output;

async function loadModules() {
  const openaiModule = await import("langchain/chat_models/openai");
  const schemaModule = await import("langchain/schema");
  const { ChatOpenAI } = openaiModule;
  const { HumanChatMessage, SystemChatMessage } = schemaModule;
  const chat = new ChatOpenAI({ openAIApiKey: YOUR_API_KEY_HERE, temperature: 0.7 });
  // Now you can use the chat object to interact with the model:
  
    

async function generateOutput(message) {
  let response = await chat.call([
    new HumanChatMessage(message, {max_tokens: 500})
  ]);
  //idk the deal but sometimes im getting
        //a str and sometimes an obj.
        //dont care moving on.
        if (typeof response === 'object') {
            vlog('response is: an obj')
          response = response.text;
        } else {
            vlog('response is: a str')
          response = response;
        }
  return response;
}


function vlog(...args) {
    //youll wish you hadnt:
    //console.log(...args);
}



//this fucking guy.
//more parsing response shenanigans.
//it will invent the beginning of the exchange including the result and post it in plain text ,and then include a json obj with Finish and the parser will skip everything and print its invented Finish to its invented results. so, we have to wipe that ass too.
function hasActionOrObservationOrThought(str) {
  const lines = str.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('Action:') || line.startsWith('Observation:') || line.startsWith('Thought:')) {
      return true;
    }
  }
  return false;
}

//consume/dedupe/parse response into obj
//simpler, but..its still as hit-miss as
//all the rest.
function first_convertToObj(input) {
    const regex = /"([A-Z][a-zA-Z]+)":\s*"(.*?)"/g;
    let match;
    let newob = {};
    const matches = input.matchAll(regex);
    for (const match of matches) {
      newob[match[1]] = match[2]
    }
    if(newob.Observation || newob.Thought || newob.Action) {
        if(newob.Finish) {
            delete newob.Finish;
        }
    }
    if (Object.keys(newob).length === 0) {
        return false;
    } else {
        return newob;
    }
}



//old but not oldest version of above ^^
//the idea this one is after is locating
//the first valid json object in the text.
//it was doing decent and then botface started
//mixing it up and using singlequotes around
//stuff, which i tried some re:replacing, and
//then went to the one above to try and parse
//ALL text with "" : "" format into objects.
//which is..possibly an even worse idea.
//now im thinking of handing the answer 
//immediately back and instructing bot to create 
//valid json out of what it sees. problem is
//...that means 2 full round trips MINIMUM for 
//everything it says.

var failed_once_already = false;
function second_convertToObj(inputString) {
    let obj = {};
    let jsonObj;
    try {
      let match = inputString.match(/\s*({[\s\S]*?})\s*/);
      jsonObj = JSON.parse(match[1]);
    } catch(e) {
      console.log('first parse attempt fails.');
      try {
        inputString = inputString.replace(/"/g, '\\"');
        let match = inputString.match(/\s*({[\s\S]*?})\s*/);
        jsonObj = JSON.parse(match[1]);
      } catch(e) {
        console.log('second parse attempt also fails');
        return('newp')
      }
    }
    Object.keys(jsonObj).forEach(key => {
      if (key === 'Observation') {
        obj.Observation = jsonObj.Observation;
      } else if (key === 'Thought') {
        obj.Thought = jsonObj.Thought;
      } else if (key === 'Action') {
        obj.Action = jsonObj.Action;
      } else if (key === 'Finish' && !obj.Action && !obj.Result && !obj.Thought && !obj.Observation && !hasActionOrObservationOrThought(inputString)) { //only accept if sent solo
        obj.Finish = jsonObj.Finish;
      }
    });
    return obj;
  }





//old way before preprompting with fakejson
function convertToObj(inputString) {
  const obj = {};
  try {
    const lines = inputString.split('\n');
    lines.forEach(line => {
      if (line.startsWith('Observation:')) {
        obj.Observation = line.substring(13).trim();
      } else if (line.startsWith('Thought:')) {
        obj.Thought = line.substring(8).trim();
      } else if (line.startsWith('Action:') && line.length > 8) {
          try {
        const [actionName, actionArgs] = line.slice(8).split('[');
        obj.Action = {
          actionName, 
          actionArgs: actionArgs.slice(0, -1)
        }}
        catch(e) {
            vlog('Caught: malformed Action statement, skipping.')
            if(obj.Action) delete obj.Action
         }
      } else if (line.startsWith('Finish:')) {
        if (!obj.Action && !obj.Result && !obj.Thought && !obj.Observation) { // Only assign Finish if solo
          obj.Finish = line.substring(7).trim();
        } else {
          vlog('(Deleted Finish as result was invented - Result not yet provided.)');
        }
      } else {
        // skip lines that don't start with Observation, Thought, Action or Finish.
      }
    });
    return obj;
  } catch(e) { 
    vlog('--Caught: convertToObj cant parse return string:\n',e,'\n\n--Caught: return string was:\n',inputString); 
    return 'newp';
  }
}



//extract function name and args
//from 'Action:' line. returns object
//{actionName,actionArgs}
function parseActionLine(inputString) {
    const lines = inputString.split('\n');
    const actionLine = lines.find(line => line.startsWith('Action:'));
    if (!actionLine) {
        return null;
    }
    const [actionName, actionArgs] = actionLine.slice(8).split('[');
    return { actionName, actionArgs: actionArgs.slice(0, -1) };
    }

//globals because scope inside multinested 'while'...its too miserable.
var isFinished = false;
var count =0;
var response = ""; var output = "";
var appended_output = ""; var newprompt;
var preprompt = pp1;

//stop from endlessness
const total_allowed_loops = 10;

//'Ctrl-C' first exits chain-of-thought,
//2nd time exits CLI.
let stop = false;
process.on('SIGINT', () => {
  if (stop) {
    console.log('Bye! Exiting...');
    process.exit();
  } else {
    console.log('Press Ctrl-C again to exit');
    stop = true;
    setTimeout(() => {
      stop = false;
    }, 3000); // reset stop flag after 3 seconds
  }
});


//8// chat on a loop until ctrl-c //8//
function chatloop() {
    vlog('length:',pp1.length)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log("WELCOME! Usage: Preface prompt with [p] to use chain-of-thought preprompt. Otherwise no preprompt will be used.")
    
    rl.prompt()
    
    rl.on('line', async (input) => {
    if(input.startsWith('[p]')) {
        let responseObj;
        
      //troubleshoot shortcut [remove me]    
      if(input.length == 3) { input = '[p] calculate 12827469447/12324556' }
      
      //remove '[p]'
      newprompt = pp1 + input.trim().slice(3)+"\n";
      //console.log('prompt is:',newprompt)
      
/* /\/\/\/\ while loop /\/\/\/\/ */
      while (!stop && !isFinished && count < total_allowed_loops) { // 'Finish' element exits us. 
        
        response="";
        vlog('\n--------['+count+'] prompt is:\n'+newprompt+'\n[/end prompt '+count+']----------\n')
        vlog('['+count+'] calling api...')
        
        //the actual get
        response = await generateOutput(newprompt);
        
        
         vlog('\x1b[33m%s\x1b[0m','-------------response before parsing:--------\n'+response+'\n-------------\n')
      
     let responseObj = convertToObj(response)
        
        // fuck this tangle
        /*responseObj = (convertToObj(response) !== 'newp') ? convertToObj(response) : '\nSystem:\n    Error: AI sent malformed JSON, discarded.\n';
        if(typeof(responseObj) == "string") {
            output=responseObj
            console.log('\x1b[31m%s\x1b[0m','----ERRORRRR:\n'+responseObj)
        } else { */
        //console.log('\n(parsed/reduced response)\n',responseObj,'\n(end debug)\n')
          
          //if Finish made it thru convertToObj parser, shows over:
          if(responseObj && 'Finish' in responseObj) {
              console.log('\x1b[32m%s\x1b[0m','Finish: '+
                responseObj.Finish);
              isFinished = true; // set flag to exit loop
              break;
            }
            
          //otherwise, loops not over:
          if('Observation' in responseObj) {
              output+='\nObservation: '+responseObj.Observation
              console.log('\x1b[90m%s\x1b[0m','Observation: '+responseObj.Observation);
          }
          if('Thought' in responseObj) {
              output+='\nThought: '+responseObj.Thought
              console.log('\x1b[90m%s\x1b[0m','Thought: '+responseObj.Thought);

          }
          
          if('Action' in responseObj) {
           let action = responseObj['Action']
           if(typeof action == 'object') {
              action.actionName = action.actionName.toLowerCase();
              //console.log('GOT ACTION: ',action)
              
              if(action.actionName == 'repl') {
              
                  let evald = sandbox(action.actionArgs)
                  
                  if(typeof(evald) == 'object') {
                      evald = sandbox(JSON.stringify(action.actionArgs))
                  }
                  output+='\nAction: REPL['+action.actionArgs+']'
                  let resultString = '\nResult: ' + evald;
                  output+=resultString
                  
                  console.log('\x1b[34m%s\x1b[0m','Plugin: REPL[ '+action.actionArgs+' ]:\n')
                  console.log('\x1b[34m%s\x1b[0m','>>>>  '+resultString);

                  
              }
              if(action.actionName == "search"){
                  console.log("WARN: Search called, but search not implemented");
                  output+='\nAction: Search['+action.actionArgs+']'
                  output += 'Result: ' + '"Sorry, Search is offline."';
              }
            }
          }
        

         //build next pass
        
        vlog('back at PROMPT BUILDING, VAR output IS NOW:', output)
        console.log('['+count+']')
          newprompt = pp1+ input + output+'\n\n{';
          count+=1
      } //end while, and below, if '[p]'
        
    } else {
        //no preprompt, regular chat.
        response = await generateOutput(input);  
        console.log('\x1b[32m%s\x1b[0m',response.text);
    }
    //allow [p] to work again.
    isFinished = false; output = ""; count=0; failed_once_already = false;
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





//sandhox eval(). prevents fs writes ONLY.
//everything else open.
const vm = require('vm');
const fs = require('fs');
function sandbox(code) {
    const allowedFunctions = [
  'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate',
  'Buffer', 'process', 'crypto', 'http', 'https', 'querystring', 'string_decoder', 'util', 'zlib', 'stream',
  'tls', 'net', 'dgram', 'os', 'path', 'url', 'punycode', 'string_decoder', 'tty', 'constants', 'vm','Math'];
  const disallowedFunctions = [
    'fs.writeFile', 'fs.writeFileSync', 'fs.appendFile', 'fs.appendFileSync', 'fs.unlink', 'fs.unlinkSync', 'fs.rename',
    'fs.renameSync', 'fs.mkdir', 'fs.mkdirSync', 'fs.rmdir', 'fs.rmdirSync', 'fs.watch', 'fs.watchFile',
    'fs.unwatchFile', 'fs.createWriteStream', 'fs.symlink', 'fs.symlinkSync', 'fs.link', 'fs.linkSync',
    'fs.chmod', 'fs.chmodSync', 'fs.chown', 'fs.chownSync', 'fs.utimes', 'fs.utimesSync', 'fs.fchmod', 'fs.fchmodSync',
    'fs.fchown', 'fs.fchownSync', 'fs.futimes', 'fs.futimesSync', 'fs.access', 'fs.accessSync', 'fs.existsSync',
    'fs.stat', 'fs.statSync', 'fs.lstat', 'fs.lstatSync', 'fs.fstat', 'fs.fstatSync', 'fs.readlink',
    'fs.readlinkSync', 'fs.realpath', 'fs.realpathSync', 'fs.createReadStream'
];

  const sandbox = {
    ...global,
    console: console,
    require: require,
    module: module,
    exports: exports,
    __dirname: __dirname,
    __filename: __filename,
  };

  for (const func of allowedFunctions) {
    sandbox[func] = global[func];
  }

 for (const func of disallowedFunctions) {
  const parts = func.split('.');
  const parentObj = parts.slice(0, parts.length - 1).reduce((obj, key) => obj && obj[key], sandbox);
  if (!parentObj) {
    continue; // skip this function if the parent object is not defined
  }
  const lastKey = parts[parts.length - 1];
  parentObj[lastKey] = () => {
    console.log('1. Sandbox Error: Agent requested',func,'which is currently not permitted.')
    return(`You are in a sandbox that limits fs writes. Function "${func}" is not allowed.`);
  };
}

  let result;
  try {
    const script = new vm.Script(code);
    result = script.runInNewContext(sandbox);
  } catch (error) {
    if (error instanceof TypeError) {
      
      console.log('2. Sandbox Error: Caught TypeError:', error.message);
      return;
    } else {
        console.log('3. Sandbox Error: Caught: ',error)
      return error.toString().slice(0, 50) + '[...]';
    }
  }
  if(result == undefined) {
      return('JS sandbox execution finished without error, but did not return a value.')
  }
  return result;
}



/*


Here is a table of 15 ANSI escape colors:

1. Black: '\x1b[30m%s\x1b[0m'
2. Red: '\x1b[31m%s\x1b[0m'
3. Green: '\x1b[32m%s\x1b[0m'
4. Yellow: '\x1b[33m%s\x1b[0m'
5. Blue: '\x1b[34m%s\x1b[0m'
6. Magenta: '\x1b[35m%s\x1b[0m'
7. Cyan: '\x1b[36m%s\x1b[0m'
8. White: '\x1b[37m%s\x1b[0m'
9. Bright Black: '\x1b[90m%s\x1b[0m'
10. Bright Red: '\x1b[91m%s\x1b[0m'
11. Bright Green: '\x1b[92m%s\x1b[0m'
12. Bright Yellow: '\x1b[93m%s\x1b[0m'
13. Bright Blue: '\x1b[94m%s\x1b[0m'
14. Bright Magenta: '\x1b[95m%s\x1b[0m'
15. Bright Cyan: '\x1b[96m%s\x1b[0m'



//other stashed example for cred savings
[example]
Question: Does Margaret Thatcher really weigh less than two hamhocks? 
Thought: I need to find out Margaret Thatcher's weight and the weight of two hamhocks.
Action: Search[Margaret Thatcher weight]
Result: Margaret Thatcher's weight was known to be around 130 pounds.
Action: Search[weight of 1 hamhock]
Result: average hamhock weight 10 lbs
Observation: Hamhocks weigh around 10 pounds.
Thought: I can calculate now.
Action: REPL[const hamhockWeight = 10; const totalHamhockWeight = hamhockWeight * 2; const isLighter = 130 < totalHamhockWeight; isLighter;]
Result: false
Observation: The output is false, which means Margaret Thatcher weighs more than two hamhocks.
Finish: The comparison between Margaret Thatcher's weight and two hamhocks shows that she weighs more: \`const hamhockWeight = 10; const totalHamhockWeight = hamhockWeight * 2; const isLighter = 130 < totalHamhockWeight; isLighter;\`



//begin eval 'vm' sandbox / wrapper.
//this one tries harder to prevent
//bad actors by blocking more than writes.
//as gpt described it, ..oh nvm it was 5 paragraphs, tldr prevents networking also.
const vm = require('vm');
const allowedModules = {
  console: console,
  process: process,
  setTimeout: setTimeout,
  setInterval: setInterval,
  clearTimeout: clearTimeout,
  clearInterval: clearInterval,
  Buffer: Buffer,
  Math: Math,
  JSON: JSON,
  URL: URL,
  URLSearchParams: URLSearchParams,
  TextDecoder: TextDecoder,
  TextEncoder: TextEncoder,
  DataView: DataView,
  ArrayBuffer: ArrayBuffer,
  Int8Array: Int8Array,
  Uint8Array: Uint8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Int16Array: Int16Array,
  Uint16Array: Uint16Array,
  Int32Array: Int32Array,
  Uint32Array: Uint32Array,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
  BigInt64Array: BigInt64Array,
  BigUint64Array: BigUint64Array,
  Date: Date,
  RegExp: RegExp,
  Promise: Promise,
  Proxy: Proxy,
  Reflect: Reflect,
  Symbol: Symbol,
  WeakMap: WeakMap,
  WeakSet: WeakSet,
  Map: Map,
  Set: Set,
  Error: Error,
  EvalError: EvalError,
  RangeError: RangeError,
  ReferenceError: ReferenceError,
  SyntaxError: SyntaxError,
  TypeError: TypeError,
  URIError: URIError,
  Intl: Intl,
  isNaN: isNaN,
  isFinite: isFinite,
  parseFloat: parseFloat,
  parseInt: parseInt,
  decodeURI: decodeURI,
  decodeURIComponent: decodeURIComponent,
  encodeURI: encodeURI,
  encodeURIComponent: encodeURIComponent,
  escape: escape,
  unescape: unescape,
  Infinity: Infinity,
  NaN: NaN,
  undefined: undefined,
  Object: Object,
  Array: Array,
  Boolean: Boolean,
  DataView: DataView,
  Function: Function,
  Number: Number,
  String: String,
  Symbol: Symbol,
  BigInt: BigInt,
  Atomics: Atomics,
  SharedArrayBuffer: SharedArrayBuffer,
  Proxy: Proxy,
  Reflect: Reflect,
  WebAssembly: WebAssembly
};

function sandbox(code) {
  const sandboxedModules = {
    ...allowedModules,
    fs: undefined,
    child_process: undefined,
    cluster: undefined,
    dgram: undefined,
    dns: undefined,
    http2: undefined,
    net: undefined,
    os: undefined,
    path: undefined,
    querystring: undefined,
    readline: undefined,
    repl: undefined,
    stream: undefined,
    timers: undefined,
    tls: undefined,
    tty: undefined,
    udp: undefined,
    url: undefined,
    v8: undefined,
    vm: undefined,
    worker_threads: undefined,
    zlib: undefined
  };

  const sandbox = {
    ...sandboxedModules,
    module: {},
    exports: {},
    require: (moduleName) => {
      if (moduleName in sandboxedModules) {
        return sandboxedModules[moduleName];
      } else {
        throw new Error(`Module "${moduleName}" not allowed.`);
      }
    }
  };

  const context = vm.createContext(sandbox);
    const script = new vm.Script(code);
  // Evaluate the script and return the result
  return script.runInContext(context);
} //end 'vm' eval wrapper.







//Davinci model:

import("langchain/llms/openai").then(module => {
  const OpenAI = module.OpenAI;
  const model = new OpenAI({ openAIApiKey: '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', temperature: 0.9 });



  async function generateOutput() {
    const res = await model.call(
      "Hi Davinci are you there?"
    );
    console.log(res);
  }

  generateOutput();
}).catch(error => {
  console.error(`Failed to load module: ${error}`);
});


////////////chatgpt model:///////////////

//translation 1. works.
Promise.all([
  import("langchain/chat_models/openai"),
  import("langchain/schema")
]).then(([openaiModule, schemaModule]) => {
  const { ChatOpenAI } = openaiModule;
  const { HumanChatMessage, SystemChatMessage } = schemaModule;
  const chat = new ChatOpenAI({ openAIApiKey: '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', temperature: 0 });
  // Now you can use the chat object to interact with the model
  
async function generateOutput() {
    const response = await chat.call([
    new HumanChatMessage(
    "You are Model 1. Tell us who you are!"
    ),
    ]);
    console.log(response);
};


generateOutput();
  
  
//END of model interaction.  
}).catch(error => {
  console.error(`Failed to load module: ${error}`);
});


//////////separate attempt, both work.
async function loadModules() {
  const openaiModule = await import("langchain/chat_models/openai");
  const schemaModule = await import("langchain/schema");
  const { ChatOpenAI } = openaiModule;
  const { HumanChatMessage, SystemChatMessage } = schemaModule;
  const chat = new ChatOpenAI({ openAIApiKey: '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', temperature: 0 });
  
  
  // Now you can use the chat object to interact with the model
    
async function generateOutput() {
    const response = await chat.call([
    new HumanChatMessage(
    "Model 2! Show your team spirit!"
    ),
    ]);
    console.log(response);
};

generateOutput();
  

}//END
loadModules().catch(error => {
  console.error(`Failed to load modules: ${error}`);
});

*/