# autobabytermux
Autonomous Agent? I loved the idea of babyAGI and AutoGPT. But ..you wouldnt believe me but I program on a phone. And in that i-ate-the-tiny-mushroom place, I cant install numpy/pandas/everythingreactevermade.  But I was desperate to play so I had to make do.  It requires ```npm install langchain openai``` and THATS IT. AND: It fucking works! But needs tons of new stuff. New paragraph

Whatever. Here is pre prompt. I stole the 'QOTAR' (Question, Observation, Thought, Action, Result) 'chain-of-thought' concepts from one/both of the above 'autonomous agent' projects. And reinvented it because Phone. AND: ..Its..Alieeeeve. And. A wild hair gave me the mad idea some others might want to hack on it (or maybe I just need some sleep). Anywho. Autonomous AI Agent, on your burner. Shrugs rite? What a world

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

![pix](https://i.ibb.co/12SdWkF/Screenshot-2023-05-02-19-24-40.png)


$$$ Usage:
There's nothing to know. Have an OpenAI key ready, stick it on first line of script. Run ```npm install langchain openai```. Run ```node babyautotermux.js``` and the interactive CLI starts. The Welcome message describes that you use '[p]' to start the 'autonomous' chain of events. If you dont use [p] its *just* a standard chat interface with chatGPT.  

I really would be so...itd make my day if people liked super minimalist shit like me and wanted to hack on this! And not even like pull requests or wearing pants required. These LLMs are the coolest shit to happen since gopher

One more
![img](https://i.ibb.co/6JnYq2B/Screenshot-2023-05-02-17-54-40.png)
