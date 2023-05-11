# autobabytermux
![url](https://i.ibb.co/447k88W/Screenshot-2023-05-08-20-42-30.png)

In GPT's words (later appended by me):

>Autobabytermux is a project that is realizing multi-turn feedback reasoning through an autonomous agent [AA]. Simply input your API key and ask a question, and autobabytermux will utilize plugins - 
>
> Node REPL : a sanboxed javascript interpreter with a fakefs allowing scripts to read/write that are captured in a single JSON object saved as _'fakefs.json'_ and restored each time for a pseudo persistence. 

> [Termux:API](https://wiki.termux.com/wiki/Termux:API) : Termux has a command line scriptable interface to a large amount of Android OS hardware functions - global toggles, sms phone logs' current notifications, flashlight vibration you name it. The whole enterprise. This plugin allows (and informs (and enables) ) the AA to interact directly with the hardware its on.

> Memories: Upon successful completion of a task the Agent is asked to title their script and summarize it. It is then saved to a memories.json object. Now, upon asking a Question, these memories are keyword searched using the Agent's own Observations. The results then become part of the chain of thought where the Agent is asked to (and does) interact with them. 
> 
>The AA is an incredible tool that can do so much more than just generate coherent text. With the ability to leverage plugins (and new ones that can be easily written), the LLM can tackle complex tasks that it previously couldn't. It can now provide exact answers to complicated math problems, automate programming and debugging tasks, interact with almost every aspect of your OS via Termux:API, and much more: the potential for "self-healing", the AA could even begin to write and revise its own codebase, creating a truly autonomous and self-sustaining system. The future is exciting for the AA and its potential applications.

>At its core, autobabytermux is an autonomous AI agent that can run entirely on your phone. It requires only ONE npm module - openai - to function. 

>The QOTAR (Question, Observation, Thought, Action, Result) chain-of-thought framework guides the reasoning process, allowing the agent to efficiently arrive at an answer to your question. 

>It is worth noting that autobabytermux is a massively micro version of similar projects that typically require advanced dependencies such as numpy and pandas. Because autobabytermux is designed to run within Termux on a phone, it is much more lightweight and accessible. 


### Usage:

```git clone https://github.com/rocket-pig/autobabytermux; cd autobabytermux```

 Run 

```npm install openai```

(Optional: ```apt install termux-api``` if you want AA to have access to all [this glory](https://wiki.termux.com/wiki/Termux:API)
and ```npm install minisearch``` (5Kb) if you want to make/recall memories. )

Have an OpenAI key ready, stick it on first line of script.  Then, run

```node autobabytermux.js``` 

and the interactive CLI starts. You can also pass a question in on the command line (in quotes).  You can type ```*s``` at any time to debug the sandbox environment directly.
The vm instance persists until the script stops.  The Agent has a fake, single-folder 'filesystem' that works just as it would expect, ie using (fs.readFileSync, fs.writeFileSync). 

...Autonomous AI Agent, on your burner. Shrugs rite? What a world


### Latest Updates / Changelog:

View changelog --> [click here](https://github.com/rocket-pig/autobabytermux/wiki)

## picsordidnthappen:
### Latest:
![url](https://i.ibb.co/j3xCvcB/Screenshot-2023-05-10-15-45-12.png)

### Little bit older...
![img](https://i.ibb.co/9bJtN7J/Screenshot-2023-05-06-12-23-24.png)

After this, ```cat fakefs.txt``` returns
> {"fibonacci_2023-05-06.txt":"Tutorial on printing the fibonacci sequence with Node.js:\n\nTo print the fibonacci sequence, first define a function that takes an integer n as input and returns the first n numbers of the sequence. Then, call the function with your desired n value and console.log the result. Here is an example implementation:\n\nfunction fibonacci(n) {\n  if (n <= 1) return [0, 1].slice(0, n + 1);\n  const sequence = fibonacci(n - 1);\n  sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2]);\n  return sequence;\n}\n\nconsole.log(fibonacci(10));\n"}
### Older, but you get the idea:

![url](https://i.ibb.co/bvsL8vs/Screenshot-2023-05-03-22-51-35.png)

![pix](https://i.ibb.co/12SdWkF/Screenshot-2023-05-02-19-24-40.png)


### One more

![img](https://i.ibb.co/6JnYq2B/Screenshot-2023-05-02-17-54-40.png)


### Contributing

If you want to contribute, pull requests or wearing pants not required. 
You can even just yell at me in the Issues and link a gist, whatever works.  I in every sense intend to simultaneously never take this seriously, and see it thru. This is how beauty is made. I hope you join in! - would love your unique input.

### TODO:
* ~~Why are we using langchain to access openAI? Langchain itself is completely unused. Find a cheaper openAI module or just write a quick one.~~
* Throw a quick http server (ooh with socketio??) on the end to make this an API we can poke from elsewhere.
* Bullet point 3
* ~~Its about to remember how to remember~~
* questions on argv are getting butchered somewhere
* memories pruning (agent revision?)

### Further Reading / Links

* https://github.com/Timothyxxx/Chain-of-ThoughtsPapers
* https://tsmatz.wordpress.com/2023/03/07/react-with-openai-gpt-and-langchain/
