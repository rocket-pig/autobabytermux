# autobabytermux
![url](https://i.ibb.co/447k88W/Screenshot-2023-05-08-20-42-30.png)

In GPT's words:

>Autobabytermux is a project that enables multi-turn feedback reasoning through an autonomous agent [AA]. Simply input your API key and ask a question, and autobabytermux will utilize plugins: Node REPL and/or Termux:API to arrive at an answer/solution. 

>The AA is an incredible tool that can do so much more than just generate coherent text. With the ability to leverage plugins (and new ones that can be easily written), the LLM can tackle complex tasks that it previously couldn't. It can now provide exact answers to complicated math problems, automate programming and debugging tasks, interact with almost every aspect of your OS via Termux:API, and much more: the potential for "self-healing", the AA could even begin to write and revise its own codebase, creating a truly autonomous and self-sustaining system. The future is exciting for the AA and its potential applications.

>At its core, autobabytermux is an autonomous AI agent that can run entirely on your phone. It requires only ONE npm module - openai - to function. 

>The QOTAR (Question, Observation, Thought, Action, Result) chain-of-thought framework guides the reasoning process, allowing the agent to efficiently arrive at an answer to your question. 

>It is worth noting that autobabytermux is a massively micro version of similar projects that typically require advanced dependencies such as numpy and pandas. Because autobabytermux is designed to run within Termux on a phone, it is much more lightweight and accessible. 


### Usage:

```git clone https://github.com/rocket-pig/autobabytermux; cd autobabytermux```

 Run 

```npm install openai```

(Optional: ```apt install termux-api``` if you want AA to have access to all [this glory](https://wiki.termux.com/wiki/Termux:API)

Have an OpenAI key ready, stick it on first line of script.  Then, run

```node autobabytermux.js``` 

and the interactive CLI starts. You can also pass a question in on the command line (in quotes).  You can type ```*s``` at any time to debug the sandbox environment directly.
The vm instance persists until the script stops.  The Agent has a fake, single-folder 'filesystem' that works just as it would expect, ie using (fs.readFileSync, fs.writeFileSync). 

...Autonomous AI Agent, on your burner. Shrugs rite? What a world


### Latest Updates / Changelog:

__May 10 23__:

* Enable termux-api 'help helper': termux-api cmds have their help @ '-help' OR '--help' OR '-h' OR sometimes no hook at all. Sometimes the help is @ stdout.. OR stderr. Sometimes the command hangs for 15 seconds first.  I finally wrote a long convoluted and tiresome script to aggregate them all into a json file.  Turning this on means you want REPL calls to '-h' to return text from the json instead of watching the Agent bomb out for eleventy tries.
USE_HELP_HELPER = true;

* Enable 'Memory' chain of events. _(requires: npm install minisearch, a tiny little 5K thing with no deps.)_ Previous completed tasks will be searched and top match included in conversation. Agent is prompted to revise top match (or dismiss if not relevant). Agent will also be prompted after successful 'Finish' with titling and saving new memory. Six or so memories are already included, probably add more over time.
ENABLE_MEMORY = true;

See https://github.com/rocket-pig/autobabytermux/blob/main/README.md#latest for a screenshot.

_(Note these are both written in a way they can be toggled off - Idk why youd want to. But its all optional. Make sure you re-clone and get the new .json files.)_

* Other changes: like causing termux-api cmds to give feedback, ala 'cmd completed successfully, but with no output' if otherwise silent has REALLY helped the Agent move on. It..is a bit sad really, watching it go around in circles about how to verify the command completed :/ Well, not anymore. :)

__May 8 23__:
* Termux:API plugin! Barely tested. But, AA is already getting it! Pretty cool. User can decide what api commands are available to the Agent in the global settings area at the top of the script.


[screenshot](https://i.ibb.co/QFJpnXX/Screenshot-2023-05-08-13-54-12.png)


__May 7 2023__:
* Found a stupid typo: stdout/stderr/log from vm works as it should have been all along now.
* Added shortcut back that slides into a vm REPL shell. Changed it to '*s' (The [s] is not fun to type when you dont have your external keyboard)
* A ton of little bugs (like not sending the prefix to the global_history) that while things were still working before, its even better/faster now.
* __I tested removing the 2k char preprompt__ and preliminary tests show that the single-sentence subprompts __may be all thats needed_. If so that saves an absolute ton of API credits.  Ill make that the default after more testing.
* process module is now correctly merged with stdout/stderr overrides so its otherwise functional
* changed the write/read methods to what is actually happening underneath...its just less confusing.
* ton of other tweaks and upgrades I cant recall now.

__May 6 2023__:
* Removed useless langchain dependency. We were simply being lazy and using their openai interface. Now just uses openai official module.
* _Complete code rewrite_: The Q/A flow is now controlled by a delegator that steps thru the Q-O-T-A-F process, with re-prompts each time to keep the LLM on track. It is. so. much faster and more reliable than the previous way of attempting to parse entire return body!  This way we arent _ever_ consuming or trying to handle hallucinations.
* The overall readability is also just incomparably superior to the previous code.  I had ironed out all the necessary parts but it needed this refactoring and cleanup something fierce.
* It can now be run with a question (in quotes) as the first arg on command line.
* More settings at the top of the file as well for controlling output verbosity, API request limits etc.

__May 3 2023__: 'fakefs' wrapper allows AA to have a persistent single-dir 'filesystem' that's saved to fakefs.txt and restored each time.  The sandbox otherwise prevents filesystem writes *even to the sandbox* (using normal methods.) So you can let it do it's thing without worrying about it trashing your drive, AND be able to run commands that save/restore states/data.



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
* Its about to remember how to remember

### Further Reading / Links

* https://github.com/Timothyxxx/Chain-of-ThoughtsPapers
* https://tsmatz.wordpress.com/2023/03/07/react-with-openai-gpt-and-langchain/
