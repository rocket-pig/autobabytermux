# autobabytermux

In GPT's words:

>Autobabytermux is a project that enables multi-turn feedback reasoning through an autonomous agent [AA]. Simply input your API key and ask a question, and autobabytermux will utilize plugins (including a working JavaScript interpreter) to arrive at an answer. 

>The AA is an incredible tool that can do so much more than just generate coherent text. With the ability to leverage plugins (and new ones that can be easily written), the LLM can tackle complex tasks that it previously couldn't. It can now provide exact answers to complicated math problems, automate programming and debugging tasks, and much more: the potential for "self-healing", the AA could even begin to write and revise its own codebase, creating a truly autonomous and self-sustaining system. The future is exciting for the AA and its potential applications.

>At its core, autobabytermux is an autonomous AI agent that can run entirely on your phone. It requires only two npm modules - langchain and openai - to function. 

>The QOTAR (Question, Observation, Thought, Action, Result) chain-of-thought framework guides the reasoning process, allowing the agent to efficiently arrive at an answer to your question. 

>It is worth noting that autobabytermux is a massively micro version of similar projects that typically require advanced dependencies such as numpy and pandas. Because autobabytermux is designed to run within Termux on a phone, it is much more lightweight and accessible. 


### Latest Updates:
*May 6 2023*:
The Q/A flow is now controlled by a delegator that steps thru the Q-O-T-A-F process, with re-prompts each time to keep the LLM on track. It is. so. much faster and more reliable than the previous way of attempting to parse entire return body!  This way we arent _ever_ consuming or trying to handle hallucinations.

The overall readability is also just incomparably superior to the previous code.  I had ironed out all the necessary parts but it needed this refactoring and cleanup something fierce.

It can now be run with a question (in quotes) as the first arg on command line.

More settings at the top of the file as well for controlling output verbosity, API request limits etc.

I'd call this '1.0' if that were my thing. w00t



### Usage:

```git clone https://github.com/rocket-pig/autobabytermux; cd autobabytermux```

 Run 

```npm install langchain openai```

Have an OpenAI key ready, stick it on first line of script.  Then, run

```node autobabytermux.js``` 

and the interactive CLI starts. The Welcome message describes that a prompt prefaced with [p] will start the chain-of-thought chain-of-events. Prefacing with [s] will pass your command directly into the vm. You can also just chat with chatGPT normally.

The vm instance persists until the script stops.  The Agent has a fake, single-folder 'filesystem' that works just as it would expect, (fs.readFile, fs.writeFile).  The user can press [s] to access the 
vm instance directly. No created 'files' persist (they are stored in a js obj and tossed when the vm ends).

...Autonomous AI Agent, on your burner. Shrugs rite? What a world

### Latest:

![url](https://i.ibb.co/bvsL8vs/Screenshot-2023-05-03-22-51-35.png)


### Older, but you get the idea:

![pix](https://i.ibb.co/12SdWkF/Screenshot-2023-05-02-19-24-40.png)


### One more

![img](https://i.ibb.co/6JnYq2B/Screenshot-2023-05-02-17-54-40.png)


### Contributing

If you want to contribute, pull requests or wearing pants not required. 
You can even just yell at me in the Issues and link a gist, whatever works.  I in every sense intend to simultaneously never take this seriously, and see it thru. This is how beauty is made. Join in plz! - we would love your trippy (or not) input.
