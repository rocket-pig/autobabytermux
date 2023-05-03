var YOUR_API_KEY = 'OPENAI KEY HERE'

var pp1 = `
Available plugins:
Google Search:
Result = Search[phrase]
Node.js REPL:
Result = REPL[inputString]
NOTE: Printing to sdout or console will NOT return anything to Result.
Rules: All responses follow the same flow: Observation, Thought, Action, (these three repeated if necessary), and finally Finish.
Each line begins with keyword to signify which. Input MUST be on a single line or will get truncated, especially when using plugins.
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
  const chat = new ChatOpenAI({ openAIApiKey: YOUR_API_KEY, temperature: 0.7, timeout: 50000 });
  //everything is inside loadModules:




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


function vlog(...args) {
    //youll wish you hadnt:
    //console.log(...args);
}

const fs = require('fs');

function flog(...args) {
  const str = args.join(' ')+'\n';
  fs.appendFileSync('log.txt', str);
}


//the much improved input parser.
//gets args to Plugins much, much better.
function convertToObj(inputString) {
    const obj = {};
    const lines = inputString.split('\n');
    
    function findLine(lines, prefix) {
    const line = lines.find(line => line.startsWith(prefix));
    return line ? line.substring(prefix.length).trim() : null;
    }
 
    const observation = findLine(lines, 'Observation:');
    if (observation) {
        obj.Observation = observation;
    }
    
    const thought = findLine(lines,'Thought:')
    if (thought) {
        obj.Thought = thought;
    }

    const action = findLine(lines,'Action:')
    if (action) {
        try {
            //get Plugin name
            const argsn = /^(.*?)\[/;
            const m2 = argsn.exec(action);
            const actionName = m2[1];
            //get Plugin input str. regex abs refuses to cooperate, so we found our own way to get first/last bracket location.
            const lastBracketIndex = action.lastIndexOf("]");
            const firstBracketIndex = action.indexOf("[");
            const actionArgs = action.substring(firstBracketIndex + 1, lastBracketIndex);
            //save to obj
            obj.Action = { actionName, actionArgs }
            console.log('Parser Debug: obj.Action is:',JSON.stringify(obj.Action))
        } catch(e) {
            flog('Caught: malformed Action statement, skipping:',e)
            //we need to return something still, else fake Finishes will sneak past.
            obj.Action = {actionName: 'Error: Malformed plugin request.',actionArgs: ''}
        }
}

    const finish = findLine(lines,'Finish:')
    if (finish) {
        if (!obj.Action && !obj.Result && !obj.Thought && !obj.Observation) { // Only assign Finish if solo
          obj.Finish = finish
        } else {
          flog('(Deleted Finish as result was invented - Result not yet provided.)');
        }
    }
    return obj;
} //parser ends



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
    flog('length:',pp1.length)
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
        flog('\n--------['+count+'] prompt (trimmed) is:\n'+input+output+'\n[/end prompt '+count+']----------\n')
        flog('['+count+'] calling api...')
        
        //the actual get
        response = await generateOutput(newprompt);
        
        
         flog('-------------response before parsing:--------\n'+response+'\n-------------\n')
         
        //send to parser
        let responseObj = convertToObj(response)
        
          //if Finish made it thru convertToObj parser, shows over:
          if(responseObj && 'Finish' in responseObj) {
              console.log(C_Green,'Finish: '+
                responseObj.Finish);
              isFinished = true; // set flag to exit loop
              break;
            }
            
          //otherwise, loops not over:
          if('Observation' in responseObj) {
              output+='\nObservation: '+responseObj.Observation
              console.log(C_BrightBlack,'Observation: '+responseObj.Observation);
          }
          if('Thought' in responseObj) {
              output+='\nThought: '+responseObj.Thought
              console.log(C_BrightBlack,'Thought: '+responseObj.Thought);

          }
          
          if('Action' in responseObj) {
           let action = responseObj['Action']
           if(typeof action == 'object') {
              action.actionName = action.actionName.toLowerCase();
              //console.log('GOT ACTION: ',action)
              
              if(action.actionName == 'repl') {
              console.log(C_Blue,'-------------------- Plugin: REPL[]: --------------------\n')
              
                  let evald = sandbox(action.actionArgs)
                  
                  if(typeof(evald) == 'object') {
                      evald = sandbox(JSON.stringify(action.actionArgs))
                  }
                  output+='\nAction: REPL['+action.actionArgs+']'
                  let resultString = '\nResult: ' + evald;
                  output+=resultString
                  
                  console.log(C_Blue,'Plugin: REPL[ '+action.actionArgs+' ]:\n')
                  console.log(C_Blue,'>>>>  '+resultString+'\n>>>>');
                    console.log(C_Blue,'<<<<<<<<<<<<<END OF Plugin: REPL[] <<<<<<<<<<<<<<<<<<<<\n')


                  
              }
              if(action.actionName == "search"){
                  console.log("WARN: Search called, but search not implemented");
                  output+='\nAction: Search['+action.actionArgs+']'
                  output += 'Result: ' + '"Sorry, Search is offline."';
              }
            }
          }
        

         //build next pass
        
        //flog('back at PROMPT BUILDING, VAR output IS NOW:', output)
        console.log('['+count+']')
          newprompt = pp1+ input + output+'\n\n{';
          count+=1
      } //end while, and below, if '[p]'
        
    } else {
        //no preprompt, regular chat.
        response = await generateOutput(input);  
        console.log(C_Green,response);
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

