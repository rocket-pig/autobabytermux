# autobabytermux

In GPT's words:

>Autobabytermux is a project that enables multi-turn feedback reasoning through an autonomous agent [AA]. Simply input your API key and ask a question, and autobabytermux will utilize plugins (including a working JavaScript interpreter) to arrive at an answer. 

>The AA is an incredible tool that can do so much more than just generate coherent text. With the ability to leverage plugins (and new ones that can be easily written), the LLM can tackle complex tasks that it previously couldn't. It can now provide exact answers to complicated math problems, automate programming and debugging tasks, and much more: the potential for "self-healing", the AA could even begin to write and revise its own codebase, creating a truly autonomous and self-sustaining system. The future is exciting for the AA and its potential applications.

>At its core, autobabytermux is an autonomous AI agent that can run entirely on your phone. It requires only two npm modules - langchain and openai - to function. 

>The QOTAR (Question, Observation, Thought, Action, Result) chain-of-thought framework guides the reasoning process, allowing the agent to efficiently arrive at an answer to your question. 

>It is worth noting that autobabytermux is a massively micro version of similar projects that typically require advanced dependencies such as numpy and pandas. Because autobabytermux is designed to run within Termux on a phone, it is much more lightweight and accessible. 




### Usage:

Have an OpenAI key ready, stick it on first line of script. Run 

```npm install langchain openai```. Then, run 

```node babyautotermux.js``` 

and the interactive CLI starts. The Welcome message describes that a prompt prefaced with '[p]' will start the chain-of-thought chain-of-events. Prefacing with [s] will pass your command directly into the vm. You can also just chat with chatGPT normally.

The vm instance persists until the script stops.  The Agent has a fake, single-folder 'filesystem' that works just as it would expect, (fs.readFile/readFileSync, fs.writeFile/writeFileSync).  The user can press [s] to access the 
vm instance directly.

...Autonomous AI Agent, on your burner. Shrugs rite? What a world

### Latest:

![url](https://i.ibb.co/bvsL8vs/Screenshot-2023-05-03-22-51-35.png)


### Older, but you get the idea:

![pix](https://i.ibb.co/12SdWkF/Screenshot-2023-05-02-19-24-40.png)


### One more

![img](https://i.ibb.co/6JnYq2B/Screenshot-2023-05-02-17-54-40.png)


### Contributing

If you want to contribute, pull requests or wearing pants not required. 
You can even just yell at me in the Issues and link a gist, whatever works.  I in every sense intend to simultaneously never take this seriously, and see it thru. This is how beauty is made. Join in - don't be skurred - we need your trippy (or not) input.
