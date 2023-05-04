# autobabytermux

Chain-of-thought reasoning for chatGPT. Put your API key in, ask a question, and it will do multi-turn feedback reasoning, use plugins (the js interpreter is working great), and eventually arrive at an answer. 

I had gpt write me a better overview as 'front of house' has never been my strong suit:

>Autobabytermux is a project that enables multi-turn feedback reasoning through an autonomous agent [AA]. Simply input your API key and ask a question, and autobabytermux will utilize plugins (including a working JavaScript interpreter) to arrive at an answer. 

>The AA is an incredible tool that can do so much more than just generate coherent text. With the ability to leverage plugins (and new ones that can be easily written), the LLM can tackle complex tasks that it previously couldn't. It can now provide exact answers to complicated math problems, automate programming and debugging tasks, and much more: the potential for "self-healing", the AA could even begin to write and revise its own codebase, creating a truly autonomous and self-sustaining system. The future is exciting for the AA and its potential applications.

>At its core, autobabytermux is an autonomous AI agent that can run entirely on your phone. It requires only two npm modules - langchain and openai - to function. 

>The QOTAR (Question, Observation, Thought, Action, Result) chain-of-thought framework guides the reasoning process, allowing the agent to efficiently arrive at an answer to your question. 

>It is worth noting that autobabytermux is a massively micro version of similar projects that typically require advanced dependencies such as numpy and pandas. Because autobabytermux is designed to run within Termux on a phone, it is much more lightweight and accessible. 




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
