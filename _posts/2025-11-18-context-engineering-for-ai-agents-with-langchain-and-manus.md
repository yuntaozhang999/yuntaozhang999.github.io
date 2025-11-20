This is the transcribed conversation from a highly informative session on context engineering, featuring Lance Martin (LangChain) and Yichao "Peak" Ji (Manus). You can watch the full session on [YouTube](https://www.youtube.com/watch?v=6_BcCthVvb8).

*  **Lance Martin's slides (LangChain):** [Link to Slides](https://docs.google.com/presentation/d/16aaXLu40GugY-kOpqDU4e-S0hD1FmHcNyF0rRRnb1OU/edit?slide=id.p&pli=1#slide=id.p)
*  **Yichao "Peak" Ji's slides (Manus):** [Link to Slides](https://drive.google.com/file/d/1QGJ-BrdiTGslS71sYH4OJoidsry3Ps9g/view?pli=1)


Lance: All right. Well, thank you all for coming. We'll go ahead and kick off the webinar now. I'm sure people will continue to stream in. I'm Lance, one of the founding engineers at LangChain. I'm joined by Peak from Manus. Peak, do you want to introduce yourself quickly?

Yichao (Peak): Yeah. Hey guys, I'm the co-founder and chief scientist of Manus. So basically I designed the agent framework and a lot of things in Manus and I'm super excited to be here today. Thanks Lance for having me. 

Lance: Yeah, we're really excited to do this. Because first Manus is a really cool product. I've been using it for a long time. But also they put out a really nice blog post on context engineering a few months ago that influenced me a lot. So I want to give a quick overview of context engineering as I see it. And I'll reference their piece. And then Peak's actually going to give a presentation talking about some new ideas not covered in the piece. So if you've already read it, Peak is going to cover some things that are new, which hopefully be quite interesting for you. But I'll kind of set the stage and I'll hand it over to Peak. And then we'll do some Q&A. 

Lance: So you might have heard this term context engineering and it kind of emerged earlier this year. If you look through time with Google search trends, prompt engineering was kind of initiated following chatGPT. So that's showing December 2022. And when we got this new thing, a chat model, there became a great deal of interest in how do we prompt these things? Prompt engineering kind of emerged as a discipline for working with chat models and prompting them. Now context engineering emerged this year around May. We saw it really rising in Google trends and it corresponds a bit with this idea of the year of agents. And so why is that? One of the things that people have observed if you've been building agents is that context grows and it grows in a very particular way when you build an agent. What I mean is we have an LLM bound to some number of tools that LLM can call tools autonomously in a loop. The challenge is for every tool called, you you get a tool observation back and that's appended to this chat list. These messages grow over time and so you can kind of get this unbounded explosion messages as agents run. As an example, Manus talked about their piece that typical tasks require around 50 tool calls. Anthropics mentioned similarly that production agents can engage in conversations spanning hundreds of turns. So the challenge is agents that because they are increasingly long-running and autonomous, they utilize tools freely, you can accumulate a large amount of context through this accumulation of tool calls. Chroma put out a really nice report talking about the observation simply that performance drops as context grows. So this paradox, this challenging situation, agents utilize lots of context because of tool calling but we know that performance drops as context grows. So this is a challenge that many of us have faced and it kind of spearheaded this or I think seeing this term of context engineering, Karpathy of course kind of coined it on Twitter earlier this year. And you can think about context engineering is the delicate art and science of filling the context window with just the right information needed for the next step. So trying to combat this context explosion that happens when you build agents and they call tools freely. All those tool messages accumulate in your messages queue. How do we kind of call such that the right information is presented to the agent to make the correct next decision at all points in time. So to address this, there's a few common themes I want to highlight that we've seen across a number of different pieces of work, including Manus, which I'll mention here.

Lance: Idea one is context offloading. So we've seen this trend over and over. The central idea is you don't need all context to live in this messages history of your agent. You can take information and offload it, send it somewhere else, so it's outside the context window, but it can be retrieved, which we'll talk about later. So, one of the most popular ideas here is just using a file system. Take the output of a tool message as an example. Dump it to the file system, send back to your agent just some minimal piece of information necessary so it can reference the full context if it needs to, but that full payload, for example, web search result that's very token-heavy isn't spammed into your context window for perpetuity. So you've seen this across a number of different projects. Manus uses this. We have a project called deep agents that utilizes the file system. Open deep research utilizes. Actually agent state has a similar role to external file system. Claude Code of course uses this very extensively. Long-running agents utilize it very extensively. So this idea of offloading context to a file system is very common and popular across many different examples of production agents that we're seeing today.

Lance: The second idea is reducing context. So offloading is very simply taking some piece of information a tool message that's token-heavy and not sending it all back to your messages list, dumping it to a file system where it can be retrieved only as needed. That's offloading. Reducing the context is similar but instead you're just summarizing or compressing information. Summarizing tool call outputs is one intuitive way to do this. So we do this with open deep research as an example. Pruning tool calls or tool messages. One thing that's very interesting is Claude 4.5 has actually added this to, if you look at the some of their most recent releases, they now support this out of the box. So this idea of pruning old tool calls with tool outputs or tool messages is something that Claude is now kind of built into their SDK. Summarize your compacting full message history. You see this with Claude Code in its compaction feature, once you hit a certain percentage of your overall context window. Cognition also talks about idea of summarizing/prunning at agent to agent handoffs. So this idea of reducing context is a very popular theme we see across a lot of different examples from Claude Code to our open deep research, cognition, Claude4.5 has incorporated this as well. 

Lance: Retrieving context. Now this is one of the classic debates today that you might see raging on X or Twitter. The right approach for retrieving context. Lee Robinson from cursor just had a very nice talk and I'll make sure these slides are all shared so you can see these links. He had a very nice talk at OpenAI demo day talking about cursor for example uses indexing and semantic search, as well as more kind of simple file-based search tools glob and grep. Claude code of course only uses the file system and simple search tools, notably glob and grep. So there's different ways to retrieve context on demand for your agent. Indexing and something semantic search, file system and simple file search tools both can be highly effective. There's pros and cons we could talk about in the Q&A. But of course context retrieval is central for building effective agents.

Lance: Context isolation is the other major theme we've seen quite a bit of. In particular, splitting context across multi-agents. So what's the point here? Each sub agent has its own context window and sub agents allow for separation of concerns. Manus wide agents talks about this. Our deep agents work uses this. Open deep research uses it. Sub agents are utilized in claude's multi-agent researcher. And also claude code support sub agent. So sub agents are a very common way to perform context isolation we've seen across many different projects.

Lance: Now one thing I thought was very interesting is caching context and Manus talks about this quite a bit. I'll let Peak speak to this a bit later but I think it's a very interesting trick as well. So I'll just show a brief example that we've seen across open deep research. This is a very popular repo that we have. It's basically an open-source deep research implementation, and it performs on par with some of the best implementations out there. You can check our repo, and we have results from deep research bench showing that we're top 10. It has three phases: scoping of the research, the research phase itself using a multi-agent architecture, and then a final one-shot writing phase. We use offloading: we basically create a brief to scope our research plan and offload that, so we don't just save it in the context window because that context window is going to get peppered with other things. We offload it, so it's saved independently and can be accessed, in our case from the langgraph state, but it could also be from the file system. It's the same idea. So you create a research plan, you offload it. It's always accessible. You go do a bunch of work. You can pull that back in on demand so you can put it kind of at the end of your message list, so it's accessible and readily available to your agent to perform, for example the writing phase. We use offloading as you can see to help steer the research and writing phases, we use reduction to summarize observations from token-heavy search tool calls. that's done inside research itself. and we use context isolation across sub-agents within research itself. This is kind a summary of these various ideas across a bund of different projects. And actually, Peak will speak to Manus in particular and some of the lessons they've learned. This just kinds of sets up the stage, and this just kind of summarizes what I talked about. These different themes of offloading, reducing, context retrieving, context isolating, caching, and a number of projects, and kind of where they were used. And a few differnet links. I will share slides in the notes. I do want to let Peak go ahead and present now. Because I want to make sure we have plenty of time for him and for questions. But this just sets the stage. I'll let you take it from here and I'll stop sharing.

Peak: Okay. Can you see my slides?

Lance: Yeah. Okay. Perfect.

Peak:  Okay. Thank you, Lance. I'm super excited to be here today to share some fresh lessons on context engineering that we learned from building Manus.  here I say fresh lessons because I realized that the the last blog post that you mentioned I wrote about context engineering was back in July. and yeah it's the year of the agent so July is basically the last entry. And of course before this session I went back and read it again and luckily I think most of what I wrote in that blog still hold up today. But I just don't want to waste everybody's time by just repeating what's already inside that blog. So today I think instead, I want to dig into some areas that I either didn't go deep enough on before or didn't touch at all. So actually we'll be focusing on the discourage column in Lance's earlier slide. Because  personally I think exploring those non-consensus ideas often leads to the biggest inspirations.

Peak: Yeah. So here's the topic for today's talk. First we'll cover a bit about the bigger question of why we need context engineering. and then we'll have more on context reduction, more on context isolation and finally some some new stuffs about context offloading which we are testing internally here at manus. yeah so everything I'm sharing today is in production in manus. it's battle tested. but I don't know how how long it will last because  things are changing super fast. okay let's start with the first big question. it's why do we even need context engineering especially  when fine-tuning or post- training models has become much more accessible today. yeah for example folks at the thinking machine team they just released the tinker API which I a lot. but for me the question why context engineering actually came through several painful stages of realization before starting manuss I've already spent over 10 years in natural language processing or NLP which is basically what we call building language models but before chatGPT. and Manus is actually my second or third company and my previous startup we trained our own language model from scratch to do open domain information extraction and building knowledge graph and semantic search engines on top of them and it was painful. Our product's innovation speed was completely capped by the model's iteration speed. , even back then the the the models were much smaller comparing to today, but still a single training plus evaluation cycle could take maybe one or two weeks and the worst part is that at that time we hadn't reached PMF yet. and we're spending all that time improving benchmark that might not even matter for the product. So I think um instead of building specialized models too early, startups really should lean on general models and context engineering for as long as possible. Well, of course, I guess now that's some kind of common wisdom. But as your product matures and open source base model gets stronger, I know it's very tempting to think, hey, maybe I should just pick a strong base model, fine-tune it with my data, and make it really good at my use case. , we've tried that too. And guess what? It's another trap. , to make AR work really well, you usually fix an action space, design a reward around your current product behavior, and generate tons of on policy rollouts and feedback. But, , this is also dangerous because we're still in the early days of AI and agents. Everything can shift under a feet overnight. For us, the classic example was the launch of MCP. Actually, it completely changed the design of Manus from a compact static action space to something it's infinitely extensible. And if you have ever trained your own model,  that this kind of open domain problem is super hard to optimize. Well, of course, you could pour massive effort into post training that ensures generalization, but then aren't you basically trying to become an LLM company yourself? Because you're basically rebuilding the same layer that they have already built. And that's a duplication of effort. So maybe after all that buildup, here's my point. Be firm about where you draw the line. Right now, context engineering is the clearest and most practical boundary between application and model. So trust your choice. 

Peak: All right, enough philosophy and let's talk about some real tech. first topic, context reduction. Here I want to clarify two different kinds of compaction operations because we think context reduction is fascinating but it's also a new concept. There's a lot of way to do this and here in manus we divide them into compaction and summarization. For compaction in manus every tool call and tool result we actually has two different formats: a full format and a compact one. The compact version strips out any information that can be reconstructed from the file system or external state. For example here, let's say you have a a tool that writes to a file and it probably has two fields a path and a content field. But once the tool returns, you can ensure that the file already exists in the environment. So in the compact format we can safely drop the super long content field and just keep the path. And if your agent is smart enough, whenever it needs to read that file again, it can simply retrieve it via the path. So no information is truly lost. it's just externalized. We think this kind of reversibility is crucial because agents do chain predictions based on previous actions and observations and you never know which past action will suddenly become super important 10 steps later. You cannot predict it. So this is a a reversible reduction by using compaction. 

Peak: Of course compaction only take you so far. Eventually your context will still grow and will hit the ceiling. And that's when we combine compaction with the more traditional summarization. but we do it very carefully. For example here before summarizing we might offload key parts of the context into files. And sometimes we even do more aggressively. we can dump the entire pre-summary context as a text file or simply a log file into the file system so that we can always recover it later. And Lance just mentioned some people just use glob and grep. So if the model is smart enough it even knows how to retrieve those presummarized context. Yeah. So I think the difference here is that compaction is reversible but summarization isn't. both reduce context lengths but they behave very differently. and to make both methods coexist we have to track some context length thresholds. at the top you'll have your models hard context limit say 1 million tokens pretty common today but  in reality most models start degrading much earlier typically maybe around 200k. and you'll begin to see what we call a context rot repetitions slower inferences degraded quality. So by doing a lot of evaluation it's very important for you to identify that pre- rot threshold. it's typically 128K  to 200K and use it as the trigger for context reduction and whenever your context size approaches it you have to trigger context reduction. but starting from compaction not summarization. and compaction doesn't mean compressing the entire history.  we might compactate the oldest 50% of tool calls while keeping the newer ones in full detail so the model still has fresh few-shot examples to know to use tools properly. Otherwise in the worst case the model will imitate the behavior and output those compact format with missing fields and that's totally wrong. And after compaction we have to check how much free context that we actually gain from this like compaction operation. Sometimes in this graph after multiple rounds of compaction the gain is tiny because even it's compact it still uses context and that's when we go for summarization. But also keep in mind that when summarizing we always use the full version of the data not the compact one. and we still keep the last few tool calls and tool results in full detail not summary because it can allow the model to know where it left off and we'll continue like more smoothly. otherwise you'll see after summarization sometimes the model will change its style, change its tone. and we find out keeping a few tool call, tool result examples really help.

Peak: Okay, now we've covered reduction and let's talk about isolation. I really agree with Cognition's blog where they warn against using multi-agent setups because when you have multiple agents, syncing information between them becomes a nightmare. But , this isn't a new problem. Multiprocess or multi-thread coordination has been a classic challenge in the early days of computer programming. And I think we could borrow some wisdoms here. I don't know how many Golan coders are here today but  in the go programming language community there's a famous quote from this gopher " do not communicate by sharing memory, instead share memory by communicating". of course this isn't directly about agent and it's sometimes even wrong for agents. but I think the important thing is it highlights two distinct patterns here which is by communicating or by sharing memory. if we translate the term memory here into context We can see that parallel pretty clear by communicating is the easier one to understand because it is the classic subagent setup here. For example, the main agent writes a prompt and the prompt is sent to a subagent and the sub agent's entire context only consists of that instruction. We think if a task has a short clear instruction and only the final output matters say searching a codebase for a specific snippet then just use the communication pattern and keep it simple. because  the main agent doesn't care how the subagent find the code. it only needs the result and this is what Claude Code does typically using its task tool to delegate a separated clear task to some sub agents. but for more complex scenarios in contrast by sharing memory means that the subagentcan see the entire previous context. it means all the tool usage history. but the subagent has its own system prompt and its own action space for example imagine a deep research scenario, the final report depends on a lot of intermediate searches and notes and in that case you should consider using the share memory pattern or in our language by sharing context. because even you can save all that notes and and searches into file and making the sub agent to read everything again but you're just wasting latency and context. and if you count the amount of token maybe you're using even more token to do this. so we think for those scenario that requires a full history just use a share memory pattern. but be aware that sharing context is kind of expensive because  each subagent has a larger input to prefill which is you'll spend more on input tokens and since the system prompt and the access space differs you cannot reuse the KV cache. so you have to pay the full price

Peak: and finally let's talk a little bit about context offloading. when people say offload, they usually mean like moving parts of the working context into external files. But as your system grows, especially if you decide to integrate MCP, one day you realize that the tools themselves can also take up a lot of context and having too many tools in context leads to confusion. We call it context confusion and the model might call the wrong ones or even non-existing ones. So we have to find a way to also offload the tools. A common approach right now is doing dynamic rag on tool descriptions. for example loading tools on demand based on the current task or the current status. But that also causes two issues. First of all since tool definitions sit at the front of the context. Yeah, your KV resets every time. And most importantly the model's past calls to remove tools are still in the context. So it might fot the model into calling invalid tools or using invalid parameters. So to address this we're experimenting with a new layered action space in Manus. Well essentially we can let manus to choose from three different levels of abstractions. Number one function calling, number two sandbox utilities and number three packages and API. We go deeper into into these three layers of action space. 

Peak: Let's start from level one function calling. And this is a classic. Everyone knows it. It is schema safe thanks to constraint decoding. But we all know the downsides. For example, we mentioned breaking the cache and maybe too many tool calls will cause some confusion. too many tools may cause confusion. So in manus right now we only use a fixed number of atomic functions. For example reading and writing files, executing shell commands, searching files in internet and maybe some browser operations. We think these atomic functions have super clear boundaries and they can work together to compose much more complex workflows. Then we offload everything else to the next layer which is the sandbox utilities. As  each Manus session runs inside a full virtual machine sandbox. It's running on our own customized Linux system and that means Manus can use the shell commands to run pre-install utility that we develop for manus. For example, we have some format converters. We have speech recognition utilities and even a very special MCP CLI which is how we call MCP. We do not inject MCP tools to the function colony space. Instead, we do everything inside that sandbox through in the command line interface. And utilities are great because you can add new capabilities without touching the models function calling space and  it's just some commands pre-installed in your computer and if you're familiar with Linux you always know how to find those new commands and you can even run like --help to figure out how to use a new tool. and another good thing is for larger outputs they can just write to files or return the result in pages and you can use all those Linux tools grab cat less more to process that results on the fly. So the trade-off here it's super good for large outputs but it's also not that good for low latency back and forth interactions with the front end because you always have to visualize the interactions of your agent and show it to the user. So this is pretty tricky here but we think it already offloads a lot of things. And then we have another layer, the final layer, we call it packages and APIs. , here Manus can write Python scripts to call pre-authorized API or custom packages. For example, Manus might use a 3D designing library for modeling or call a financial API to fetch market data. And here actually we've purchased all these API on behalf of a user and pay the money for them. It's included in the subscription. So we basically have a lot of API keys pre-installed in manus and manus can can access these APIs using the keys. I think these are perfect for task that requires lots of computation in memory but do not need to push all that data into the model context. For example imagine if you're analyzing a stock's entire year of price data. You don't feed the model all the numbers. Instead, you should let the script to compute it and only put the summary back into the context. And , since code and APIs are super composable, you can actually chain a lot of things in one step. For example, in a typical API, you can do get city names, get city ID, get weather all in one Python script. There's also a paper from one of my friend called code act. A lot of people were discussing about it. I think it's the same idea because code is composable and it can like do a lot of things in one step but also it's  not schema safe. It's very very hard to do a strange decoding on codec. So we think you should find the right scenario for these features. For us as we mentioned everything that can handle inside a compiler or interpreter runtime. We do that using code otherwise we use sandbox utilities or function calls. And the good thing is if you have these three layers from models point all three levels still go through the standard function calls. So the interface stays simple cache friendly and orthogonal across functions because  we mentioned sandbox utilities you're still accessing these tools using the shell tool. accessing these tools using the shell function and also if you're using APIs in third party applications you're just using the file function to write or read file and then execute it using the shell function so you think it does not add overhead to the model. it's still all the things that models are trained and they're already familiar with.

Peak: so let's zoom out and connect the five dimensions offload reduce retrieve isolate and cache. you can find out that they are not independent. We can see that offload and retrieve enables more efficient reduction and stable retrieve makes isolation safe. But isolation also slows down compacts and reduces the frequency of reduction. However, more isolation and reduction also affects cache efficiency and the quality of output. So at the end of the day, I think context engineering is the science in art that requires a perfect balance between multiple potentially conflicting objectives. It's really hard.

Peak: all right. Before we wrap up, I want to leave you with maybe one final thought, and it's kind of the opposite of everything I just said, which is please avoid context over engineering. Looking back at the past six or seven months since Manus launch, actually the biggest leap we've ever seen didn't came from adding more fancy context management layers or clever retrieval hacks. They all came from simplifying or from removing unnecessary tricks and trusting the model a little more. Every time we simplify the architecture, the system got faster, more stable, and smarter because we think the goal of context engineering is to make the model's job simpler but not harder. So if you take one thing from today, I think it should be build less and understand more. Well, thank you so much everyone and thanks again to Lance and the langchain team for having me. Can't wait to see what you guys all build next. Now back to Lance.

Lance: Yeah, amazing. Thank you for that. so we have a nice set of questions here. Maybe we can just start hitting them and we can kind of reference back to the slides if needed. And Peak,are your slides available to everyone? 

Peak: oh yeah. Yeah, I can share the PDF version afterwards.

Lance: sounds good. yeah. Well, why don't I start looking through some of the questions and maybe we can start with the more recent ones first. so how does the Manus call the various shell tools? How does it know which tools exist and how to invoke them? Maybe you can explain a little bit about kind of the multi-tier kind of sandboxing setup that you use with Manus.

Peak: Yeah. I think imagine you're the person that using a new computer. For example, if  Linux, you can imagine all the tools are located in /usr/bin. So we actually we do two things. First of all, we have a hint in the system prompt telling manus that hey there's a lot of pre-installed command line utilities located in some specific folder. And also for the most frequently used ones, we already injected in the system prompt, but it's super compact. We do not tell the the agent how to use the tools. We only list them and we can tell the agent that you can use the --help flag safely because all the utilities are developed by our team and they have the same format. 

Lance: Got it. I know you talked a lot about using file system. What's your take on using indexing? and do you utilize do you spin up vector stores on the fly if the context you're working with gets sufficiently large? How do you approach that?

Peak: Yeah, I think there's no right and wrong in this space you've mentioned. but at Manus we do not use index databases because right now  every sandbox in manus session is a new one and user want to like interact with things fast. So actually we don't have the time to build the index on the fly. So we're more Claude Code. We rely on like grep and glob. But I think if you consider to build some something more long-term memory or if you want to integrate some like enterprise knowledge base, you still have to rely on that external vector index because it's only about the the amount of information that you can access but for manage it operates in a sandbox and for coding agent you operate in the codebase. So it depends on the scale. 

Lance: Yeah. So that's that's a good follow-up
then. So let's say I'm a user. I have my manus account. I interact with manus across many sessions. Do you have the
notion of memory? So claude has Claude MD files. They persist across all the different sessions of Claude Code. How
about you guys? How do you handle kind of long-term memory? Yeah. actually in Manus we have a
concept called knowledge which is kind of like explicit memory. For example, every time you can tell man, hey, remember every time I
ask for something, deliver is in maybe in Excel and it's not automatically inserted into some memory. It will pop
up a a dialogue and say here's what I learned from our previous conversation and would you accept it or reject
it? So this is the explicit one. It requires user confirmation. but also we are discovering new ways to do
it more automatically. For example, likea pretty interesting thing in
agents is that compared to chat bots, user often correct correct the agent more oftenly. For example,
like a common mistake that manners make is when doing data visualization, , if you're using
Chinese, Japanese or Korean a lot of time there will be some font issues and there will be errors in those render
render visualizations. So the user will often say hey you should use use not and CJK font and for these
kind of things the user will will a different user will will have the same correction and we need to maybe they'll
find out a way  to leverage these kind of a collective feedback and use it that's kind of we call it
self-improving agent with online learning but in a parameter free way. Yeah.
How about a a different question that that was raised here and also I think about quite a bit. You mentioned towards the end of your talk thatyou you
gained a lot from removing things and a lot of that is probably because of the fact that also the models are getting
better. So model capabilities in increasing and so you can kind of remove scaffolding over time. How do you think
about this because this is one of the biggest challenges that I've faced is over time the model gets better and I can remove things certain parts
of my scaffolding. So you're building on top of this the the foundation that's the water's rising and do you
revisit your architecture every some number of months with new releases and just delete as the models get better and
how do you how do you approach that problem? Yeah, this is a super good good question here because  actually we have
alreadyrefactored Manus for five times and we've launched Manus in March and now it's October already five times.
So we think you cannot stop because models are not only improving but they are changing models behavior are
changing over time likeone way is you can you can work closely with those model providers but we also have
another internal theory for how we evaluate or how we design our agent architecture. I cover a little bit on
Twitter before it's basically we all we do not care about a the the a
static the performance of a static benchmark. Instead we we fix the AR
agent architecture and we switch between models. If if your architecture can gain a lot from switching from a weaker
model to a stronger model then somehow your your architecture is more futurep proof because the the the the
weaker model tomorrow is might be as good as a stronger model today. Yeah. So we think switching between 
weaker and strong models can give you some early signals of what will happen next year and give you some time
to prepare your architecture. Yeah. So for manitewe often do these kind of reveal every every one or
two month and we often likedo some likeyeah do some like research
internally using open source models and maybe early access to prep proprietary models to prepare the
the the next release even before the launch of the next model. Yeah. Yeah. It's a good observation. You can
actually do testing of your architecture by toggling different models that exist today. Yeah. Yeah, that makes a lot of
sense. What aboutbest practices or considerations forformat for storing
data? So markdown files, plain text, log, anything you prefer in particular. I
think obviously it's Yeah. How do you think about that kind of file formats for Yeah.
Yeah. I think like it's the not about plain text or markdown but we always prioritize line based um
formats because it allows the models to use grap or read from read from a range of range of lines
and also markdown can sometime cause some troubles models are trained train trained to use
markdown really well and sometimes it will maybe for for for some model I don't I don't want to say that name but
but they often output too many bullet points if you use markdown too too often. Yeah. So, actually we we want
to use more plain text. Yeah, makes sense. How about on the topic ofcompaction versus
summarization? Let's hit on summarization. This is an interesting one that I've been asked a lot before. how do you prompt to
produce good summaries? So, for example, summarization, you said, it's irreversible. So, if you don't prompt it
properly, you can actually lose information. The best answer I came up with is just tuning your prompt for high recall. But
how do you approach this? So summarization, how do you think about prompting for summarization? Yeah, actually we tried a lot of a
lot optimizing the prompt for summarization. But it turns out a simple approach works really well is that you
do not use a free form prompt to let the AI generate everything. Instead, you could define a kind of a schema.
It's just a form. There's a lot of fields and let the AI to fill them. for example, here are the files that I
that I've modified and here's the goal of the user. Here's what I left off. And if you use this kind of a more
structured schema at least like the output is kind of stable and you can iterate on this. So just do not use like
free form summarizations. Got it. Yeah, that's a great observation. So you structured outputs rather than free form summarization to
enforce certain things are are always summarized. Yeah, that makes a lot of sense. How about with context? How about with
compaction then? And actually I want to make sure I understood that. So with compaction, let's say it's a a search tool. You have the raw search
tool output and would it be that would be your raw message and then the compaction would just be a file
name or something. Is that right? Yeah, it is. It's not only about the tool call. It's also applied to
the to the result of the tool  we interestingly we find out that almost every every action in man is
just kind of reversible if you can offload it to a to the file system or an
external state and for most of these tasks you already have a unique identifier for it for example for file
operations of course you have the file path for browser operations you have the URL and even for search search
um actions you have the query so it's  naturally it's already there. Yeah. Okay. This is a that's a great one
and just want to hit that again because it I've had this problem a lot. So, for example, I'm an agent that uses search.
I perform a it returns a  token-heavy tool call. I don't want to return that whole tool message tothe agent. I've done
things some kind of summarization or compaction and send the summary back. But how do you approach that? Because
you might want all that information to be accessible for the agent for his next decision. But you don't want that huge
context block to live inside your message history. So how do you approach that? You could send the whole message back
but then remove it later. That's what claude does now. You could do a summarization first and send the summary
over.you could do you could send everything and then do compaction so
that later on you don't have the whole context in your message history. You only have a link to the file. How
do you think about that specifically if you see what I'm saying? Yeah, I know actually it depends on the
scenario for for example for complex search I mean for complex search I mean it's not just one query for
example you have multiple queries and you want to like gather some important things and drop everything
else. in this case I think we should use sub agents or internally we call it agent as tool. So for the from the
models p perspective it's still a kind of function maybe called advanced search. It's a function called event search. But what it triggers is actually
another sub agent. But that subagentis more a workflow or agentic workflow
that has a fixed output schema and that is the result that returns to the agent. But for other kinds of more simpler
search for example just searching Google we just use the full detail format and append it into the
context and rely on the compactions thing. But also we always instruct the model to write down
like the intermediate insights or key findings into files in case that the compaction happens earlier than than
the model expected. And if you do this really well actually you don't lose a lot of informationby compaction
because sometimes those old tool calls are irrelevant after time. Yeah, that makes sense.and I like
the idea of agent as tool. We do that quite a bit and that does make that that is that is highly effective. But that
brings up another interesting point about and and you referenced this a little bit agent agent communication. How do you address that? So Walden Yen
from from Cognition had a very nice blog post talking about this is a major problem that they have with Devon. so
like kind of communication between agents. How do you think about that problem and yeah ensuring sufficient
information is transferred but not overloading you said the prefill of the sub agent with too much context. So
how do you think about that? Yeah.  at Menace we've launched a feature called wide
research a month ago it's basically we call yeah internally we call it agentic map reduce because we we got
inspired from the design of map reduce and it's kind of special for manus because  there's a full
virtual machine behind the session so one way we pass information or pass context from the main agent to sub agent
is by sharing the same sandbox so the file system is there and you can only pass the different path here
and I think like sending information to sub agent is not that hard. The the more more complex thing is
about how to like have the the correct output from different agents. And what we did here is we have a
trick for every every time if the main agent want to spawn up a new subagentor or maybe 10 sub agent, you have to
design you have to let the main agent  to define the output schema. And in the
in the subagentperspective, you have a special tool called submit result. And we use constraint decoding to ensure
that what the the sub agent submits back  to the main agent is the schema that is defined by the main agent. Yeah. So
you can imagine that this kind of map produce operation. It will generate a kind of spreadsheet and the
spreadsheet is constrained by the schema. That's an interesting theme that seems to come up a lot with how you design
Manus. You use schemas and structured outputs both for summarization and for this agent agent communication. So it's
kind of use schemas as contracts.yeah between agent sub agent or
between a tool and your agent to ensure that sufficient information is passed in a
structured way in a complete way. when you're doing summarization you use a schema as well. Okay fantastic. This is very very very
helpful.I'm poking around some other interesting questions here. any thoughts on models I think you
guys are use anthropic but do you work with open models?do you do
fine-tuning? you talked a lot about kind of working with KV cache so for that maybe using open models how do you think
about model choice yeah actually right now we don't use any open source model right now because
I think it's not about quality it's interestingly it's about cost  we often think that open source model
can lower the cost but if you're at the scale of Manus and and if you're building a real agent which the input is
way longer than the output then KV cache is super important and distributed KV cache is very hard to implement if you
use open source solutions and if you use those likefrontier pro LLM providers they have more solid
infrastructure for distributed cash globally. So sometimes if you do the math at least for manus we find
out that using like these flagship models can sometimes can they can be even more cheaper than using open
source models and right now we're not only using anthropic force enthropics model is the best choice for agentic task but we're also like
seeing the progress in Gemini and in open new model I think right now these frontier labs are not
converging in directions for example if you're doing coding of course you should use Claude and if you 
want to do more multimodal multimodality things you should use Gemini and open model is super good at
like complex math and reasoning. So I think for application companies us one of our advantage is that we do
not have to build on top of only one model you can do some task level routing or maybe even subtask or step
level routing if you can like calculate if you can can pull in that kind of KV hash validation. So I
think it's advantage for us and we do a lot of evaluations internally to know which models to use for which subtask.
Yeah. Yeah, that makes a lot of sense. I want to clarify one little thing. So with KV cache, so what specific features
from the or Yeah. What from the providers are you using for cache management? So okay, I know like
anthropic has input caching as an example. Yeah, that that's what you mean. Okay, got it.
Yeah, cool. Okay, perfect. 
cool. I'm just looking through some of the other questions. ,
yeah, tool selection is a good one. right. So, you were talking about this.
You don't use indexing of tool descriptions and fetching tools on the fly based on semantic similarity. How do
you handle that? what's what's the threshold for too many tools? Yeah, tool choice is a classic. How do you think
about that? Yeah. first of all, it depends on the model. Different model has different capacity for tools. But I think a
rule of thumb is try not to likeinclude more than 30 tools. It's just a random number in
my mind. But actually, I think if you're building a we call it a general AI agent Manus, you want to make
sure those native functions are super atomic. So actually there are not that much atomic function that we
need to put inside the action space. So for manus we right now we only have like 10 or 20 atomic function
and everything else is in the sandbox. Yeah. So we don't have to liketo pull things dynamically.
Yeah good point actually. Let's explain that a little bit more. So so you have let's say 10 tools that can be called
directlyby the agent. But then I guess it's you said the agent can also choose
to for example write a script and then execute a script. So that expands its action space hugely without giving it
like you don't have an independent tool for each possible script. Of course that's insane. So so our very general
tool to write a script and then run it does a lot. Is that what you mean? Yeah. Yeah. Exactly. Because  
why we are super confident to call Manus a general agent because it runs on a computer and computer are turning
complete. The computer is the best invention of human theoretically an agent can do anything that an
maybe a junior intern can do using a computer. So with the shell tool and the
and the text editor, we think it's already complete. So you can offload a lot of things, right, to sandbox.
Yeah. Okay, that makes a lot of sense, right?and then how does manage so is
are all so okay, maybe I'll back up. You mentioned code with code agents. My
understanding is the model will actually always produce a script and that'll then
be run inside a code sandbox for so every tool call is effectively a
script is generated and run. It sounds you do some hybrid where sometimes M can just call tools directly but other
times it can actually choose to do something in the sandbox. Is that right? So it's kind of a hybrid approach.
Okay. Yeah. I think this is this is super important because actually we try to use entirely to use codec for
manners but the problem is if you're using code you cannot leverage constraint decoding and things can go
wrong. Yeah but  kodak has some special use cases as I mentioned earlier
in slides for example processing a a large amount of data you don't have to port everything in the tool resol
is that you put it inside maybe the runtime memory of Python and you only get the result back  to the model. So
we think you should do it in a hybrid way. Got it. Allow for tool calling and
you've some number of tools maybe 10 or something that just called directly some number of tools that actually run
in the sandbox itself. Perfect. That makes a ton of sense. Very interesting.
Um and then maybe how do you keep a
reference of all the previously gen I guess you have so you basically will generate a bunch of files. Oh actually
sorry maybe I'll talk about something else. How about planning? Tell me about planning and and I know Manus has this to-do tool or it
generates a to-do list and start of tasks. Yeah, tell me about that. Yeah, I think this is very interesting
because at the beginning man uses that to-do.md paradigm it's kind of
I I don't want to you use the word stupid but actually it wastes a lot of turn like back in maybe
March or April if you check the log of some menace task maybe onethird of the action is about like
updating the the to-do list it wastes a lot of like tokens. Yeah. So right now we using a more structuralized
planning for example if you use Manus there's a planner at the bottom of the system internally it's also
kind of a tool called it's we implemented using the agent as tool paradigm so that there's a separate
agent that that is managing the plan so actually right now the latest version of manage we are no longer using that
to-do.md thing of course todo.md still works and it can generate good results but if you want to say save
tokens you can find another way. Got it. Yeah. So you have a planner agent and it's more for a subtask
it'll be more agent as tool call type things. Yeah. Got it. And  it it's very
important to have a separate agent to that has a different perspective so it can do some external reviews and
you can use different models for for planning for example oh yeah sometime rock can generate some very interesting insights.
Yeah. Well that's a great one actually. So think about multi-agentthen and so how do you think about that? So
you might have a planning agent with its own context window, makes a plan, produces some kind of plan object, maybe it's a file or maybe it
just calls sub agents directly. How do you think about that? and how many different sub agents do you typically
recommend using? Yeah, I think this is also depends on your design, but here at Manus
actually man is not kind of the typical multi-agentsystem. For example, we've seen a lot of different
agent that divides by role. For example, you have a designer agent or design or programming agent, manager
agent. We don't do that because we think why we have this is because this is how human company works and this
is due to the limitation of human context. So in Manus menace is a multi-agentsystem but we do not divide by
role. We only have very few agent for example we have a huge general executor agent and a planner agent and a
knowledge management agent and maybe some some yeah data API registration agent. Yeah. So we are very
very cautious about adding more sub agents because of the reason that we've mentioned before communication is very
hard and we implement more kinds of sub agents as agent as tools as we mentioned before.
Yeah, that's a yeah that's a great point. I see this mistake a lot or I don't know if it's a mistake but you see anthropomorph
anthropomorphizing agents a lot it's my designer agent and I think it's kind of a forced analogy to think about
like a human org chart in your sub agents. So got it. So for you it's a planner and knowledge manager. A
knowledge manager might do what? Likelike what will be the task of knowledge
manager? yeah it's  even more simple as we mentioned we have a knowledge
system in manage. What the knowledge agent does is that it reviews the conversation between the user and the
agent and and figure out what should be saved in in the long-term memory. So it's that simple.
Got it. Yeah. Okay. Got it's  a memory manager planner and then you have sub agents that could just take
on a general executor sub agent that could just call all the tools or actions in the sandbox.
That makes sense. Keep it simple. I that a lot, right? That makes a lot that makes a lot of sense. Um
yeah, let me see if there's any there's a bunch of questions here.but we we did hit a lot. So that's actually
um how about guardrailing? Someone asked a question about kind of safety and
guardrailing. How do you think about this? I guess that's the nice thing about a sandbox, but tell me a little bit about that. How you think about it?
Yeah, I thinkthis is very a very sensitive question because  if you have a sandbox that's connected
to the internet everything is dangerous. Yeah. So we have put a lot of effort in guard railing at least we
do not let the information to get out of the sandbox. For example, if you got prompt injected, we have
some checks on outgoing traffic. For example, we'll ensure that no token things will go out of
the sandbox. And if the the user wants to print something out of the sandbox, we have those kind of like likewhat we call it removing yeah
removing things and  to ensure that no information go out of the sandbox. But for another kind of thing is
that we have a browser inside of Manus and the browser is very complicated. For example, if you log into some like
um your websites, you can choose to let manage to persist your login state and this turns out to be like very
tricky because sometime the content of the web page can also be malicious. Maybe they they're doing like
like prompt injection and this I think is somehow out of scope for application company. So we're moving 
we're working very closely with those computer use model provider for example anthropy and Google. Yeah, they're
adding a lot of guardrails here. So right now in manage every time you do some sensitive operations whether
or inside thethe browser or in the sandbox manage well will require a manual confirmation and you must accept
it or otherwise you have to take over it to finish it yourself. So I think it's pretty hard for us to design a
a kind of a very welldesigned solution but it's a progressive approach. So right now we're letting the
user to take over more frequently but if the guard rail itself in the model gets better we can do less. Yeah.
Yeah. How about the topic of evals? This has been discussed a lot quite a bit online if you probably seen 
Claude Code. They talked a lot about just doing less formal evals at least for
code because code evals are more or less saturated lots of internal dog fooding. How do you think about evals? Are they
useful? What eval are actually useful? What's your approach? Yeah.
Yes. Yeah.  at the beginning at the launch of Nanis we're using public academic benchmarks Gaia but
then after after launching to the public we find out that it's super misaligned  models are that that
gets high scores on Gaia the user don't it. So right now we use three we have three different kinds of
evaluations first of all most importantly is that for every completed session in manage we'll request the user to give a feedback
to give one to five stars. Yeah, this is the gold standard we always care about the average user rating. This is number one. And number two, we're
still using some like internal automated tests with verifiable results. For example, we have like
created our own data set with clear answers, but also we yeah we we still use a lot of public academic
benchmarks but we also created somesome data sets that's more focused on execution because most benchmark
out there are more about readon tasks. So we designed some likelike executing tasks or transactional
task because we have the sandbox we can frequently reset the test environment. So these are the automated parts and most importantly number number
three we have a lot of interns  you have to use a lot of real human interns to do like evaluations on things
like website generation or data visualization because it's very hard to design a good reward model that
knows whether the output is visually appealing it it's about the taste. Yeah. So we still rely on on a lot of a
lot a lot. Perfect. Yeah. Let me ask you I know you're we're coming up on time, but I do
want to ask you about this emerging trend of of reinforcement learning with verifiable rewards versus just building
tool calling agents. So Claude Code extremely good and they have the benefit because they built the harness and they can
perform RL on their harness and it can get really really good with the tools they provide in the harness. Do you guys do RLor how do you think
about that? Because of course in that case you would have you using open models. I've been playing with this quite a bit
lately. How do you think about that? Just using tool calling out of the box with model providers versus doing RL
yourself inside your environment with your with your with your harness.yeah how do you think about that?
Yeah I mentioned before starting Madness I was kind of model training guy. I've been doing free training post training RL for a lot of years but
I have to say that right now if you if you have inlike sufficient resource you can try but
actually we as I mentioned earlier MCP is a big changer here because if you want to support MCP you're not
using a fixed action space and if it's not a fixed action space it's very very hard to design a good reward and
you cannot generate a lot of the the rollouts and feedbacks will be unbalanced so if you want to build a
model using that supports MCP, you are literally building a foundation model by yourself. So I think every
everyone in the in the community model companies, they're doing the same thing. They're doing the same thing for
you. So right now, I don't think we should spend that much time on doing RL right now. But as I mentioned
earlier, we are just discovering like exploring new ways to do maybe call it personalization or some
sort of online learning but using parameter freeway for example collective feedbacks.
Yeah. One little one along those lines is is it the case that for example
Anthropics done reinforcement learning at verified rewards on some set of tools using Claude Code. Have you found that
you can kind of mock your your your harness to use similar tool names to kind of unlock the same capability if
that makes sense? Likefor example I believe they've just  they've obviously performed 
they it utilized Glob uses GP uses some other set of tools for manipulating the file system. Can you effectively
reproduce that same functionality by having the exact same tools with the same tool name, same descriptions in
your harness or kind of how do you think about that unlockingunlocking the Yeah. Right. You see
what I'm saying? Yeah. Yeah. I know the clear answer here, but for us, we actually try not to use
the same name because it it will if you design your own function, you maybe have different
requirements for that function and the parameters the input arguments might be different. So you don't want to like
confuse the model if the model is trained on a lot of post training data that has some internal tools,
you don't want  to to let the models to be confused. Okay. Okay. Got it. Got it. Perfect.
Um well, I think we're actually at time and I want to respect your time because I know it's early. You're in
Singapore. it's  very early for you. Sowell this was really good. Thank you.we'll definitely
make sure this recording is available. We'll make sure slides are available.
 any parting things you want to mention, things you want to call out, calls to action. 
yeah, people should go use Manus, but the floor is yours. Yeah. I just want to say everybody try
this. We have a free tier. Yeah. Yeah. Absolutely. Hey, thanks a lot, Peak. I' love to do this again
sometime. Yeah. Thanks for having me. Yep. Okay. Bye. Bye.