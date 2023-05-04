# autobabytermux

Chain-of-thought reasoning for chatGPT. Put your API key in, ask a question, and it will do multi-turn feedback reasoning, use plugins (the js interpreter is working great), and eventually arrive at an answer. 

Autonomous Agent? In the spirit of langchain babyAGI AutoGPT etc. But ...written for a phone, on a phone.  It requires Depends on *langchain* and *openai* npm modules and THATS IT. 

### Usage:

Have an OpenAI key ready, stick it on first line of script. Run 

```npm install langchain openai```. Then, run 

```node babyautotermux.js``` 

and the interactive CLI starts. The Welcome message describes that a prompt prefaced with '[p]' will start the chain-of-thought chain-of-events. You can also just chat with chatGPT normally.


Here is pre prompt. I stole the 'QOTAR' (Question, Observation, Thought, Action, Result) 'chain-of-thought' concepts from one/both of the above 'autonomous agent' projects. And reinvented it because Phone.  Autonomous AI Agent, on your burner. Shrugs rite? What a world

```
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
```

### Latest:

![url](https://i.ibb.co/bvsL8vs/Screenshot-2023-05-03-22-51-35.png)


### Older, but you get the idea:

![pix](https://i.ibb.co/12SdWkF/Screenshot-2023-05-02-19-24-40.png)


### One more

![img](https://i.ibb.co/6JnYq2B/Screenshot-2023-05-02-17-54-40.png)


###Contributing

If you want to contribute, pull requests or wearing pants not required. 
You can even just yell at me in the Issues and link a gist, whatever works
