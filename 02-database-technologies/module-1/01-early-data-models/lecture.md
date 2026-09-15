# Early Data Models: Trees and Networks

> Before relational databases and SQL, data was organised in other shapes. This lesson covers the first two: the **hierarchical (tree)** model and the **network** model. It assumes no database knowledge beyond the fact that data has to be stored somewhere. Terms you may not have met get a plain-English version in brackets. The object-oriented and relational models come in the next lessons; everything here is the ground they were built on, including the problems they were built to solve.

## 1. The hierarchical model

### 1.1 The shape

A **tree** organises data into nodes connected by parent-child links.

- The **root node** is the single node at the top. Everything else descends from it.
- Every other node is a **child** of exactly one **parent**.
- A parent can have as many children as it likes.

That second rule is the whole model. A parent can have many children, but a child has exactly one parent, so a tree expresses a **one-to-many** relationship - written `1:M` - and nothing else. Any data that fits "this thing belongs to that thing, and only that thing" fits a tree cleanly.

Nodes with no children are the bottom of a branch, and the branches do not have to be the same length. One branch can run eight levels deep while its neighbour stops at two.

### 1.2 Where it came from

The hierarchical model is the oldest of the four, and it was built for a specific job. IBM, working with Rockwell and Caterpillar, built what became **IMS (Information Management System)** to track the bill of materials *[the full parts list for a manufactured thing, broken down into sub-assemblies and their parts]* for the Apollo programme. The system tracked millions of parts for the Apollo spacecraft and the Saturn V rocket, and it sent its first `READY` message in August 1968 at Rockwell's Space Division.

A bill of materials is a natural tree. A rocket contains stages, a stage contains engines, an engine contains pumps, a pump contains bolts. Each part sits inside exactly one assembly. The data had that shape already, so the storage model was built to match it.

### 1.3 Trees you already use

A **folder structure** is a tree. `C:\` or `/` is the root, folders are nodes with children, files are nodes without. A file lives in exactly one folder. Moving it means detaching it from one parent and attaching it to another, which is precisely the operation a tree supports.

The **DOM** *[Document Object Model - the browser's in-memory representation of an HTML page]* is a tree. `<html>` is the root, `<body>` is its child, and every element is a node with one parent and any number of children. When you write `parent.appendChild(child)` you are doing tree surgery.

> A parent can have many children. A child has exactly one parent.

## 2. A tree worth drawing: the taxonomic hierarchy

In a folder structure and in the DOM, every level means roughly the same thing - a folder inside a folder is still a folder. In the **taxonomic hierarchy** used to classify living organisms, each level means something different.

### 2.1 Ranked levels

Taxonomy is the systematic arrangement of living organisms into ranked levels. The ranks, broadest first:

**Domain → Kingdom → Phylum → Class → Order → Family → Genus → Species**

Each step down is a step in granularity. Domain is the broadest grouping; species is the most specific. A group at any one of these levels is called a **taxon** *[a named group of organisms at any rank - "Mammalia" is a taxon, and so is "Homo sapiens"]*. The plural is **taxa**. So *taxonomy* is the practice, a *taxon* is one group it produces, and *taxa* is more than one of them.

The ranks come from Carl Linnaeus, the Swedish naturalist who set the system out in the 1750s. Class was the broadest rank he proposed; phylum and domain were added later as the system was pushed further up.

Linnaeus also gave us the naming convention at the bottom. A species is named with two words, its **genus** and its **species**, which is why we are *Homo sapiens*: genus *Homo*, species *sapiens*. "Human" is the common name for that combination, not part of the scientific classification. Every organism has both - a two-word scientific name that is unique, and whatever the people living near it happen to call it.

### 2.2 Three taxa, drawn out

In class we picked three organisms and walked each one from Kingdom down to Species. We skipped Domain, because all three are in the same one. The result is [board 03](boards/03-tree-example-cont.jpeg).

| Rank | Grapevine snail | Triceratops | Human |
|---|---|---|---|
| Kingdom | Animalia | Animalia | Animalia |
| Phylum | Mollusca | Chordata | Chordata |
| Class | Gastropoda | Reptilia | Mammalia |
| Order | Heterobranchia | Ornithischia | Primates |
| Family | Helicidae | Ceratopsidae | Hominidae |
| Genus | *Helix* | *Triceratops* | *Homo* |
| Species | *pomatia* | *horridus* | *sapiens* |

Read as a tree rather than as a table, this is one root - Animalia - with two children, Mollusca and Chordata. Chordata is the only node in the drawing with more than one child of its own: Reptilia and Mammalia. Everything below that is a single chain running straight down to a species.

Heterobranchia is sitting in the Order row because that is where it falls in this drawing. Modern classification uses a lot of intermediate ranks - sub-classes, super-families - that we are ignoring here. The eight ranks above are the skeleton, not the full list.

### 2.3 Deep and thin, broad and shallow

The taxonomy tree is a strange-looking tree. It is seven levels deep and almost never branches. Compare it to a folder holding 400 photos: one level deep, 400 wide.

Both are valid trees. The difference matters when you have to **search** one. Finding a node means walking the structure, and the two standard ways of walking a tree are depth-first (follow one branch all the way down before trying the next) and breadth-first (check every node at one level before going down). Which one is faster depends entirely on whether the tree is deep and thin or broad and shallow. You will meet both properly in a later course. For now, a tree does not let you jump to a node. You walk to it from the root, every time.

## 3. Where the tree gives out

Two limitations, and they are connected.

**A tree can only express one-to-many.** There is no way to say that a node relates to a node in another branch. In the taxonomy, there is no way to record that a snail and a human both need calcium, because that fact is not about a parent and a child. The model has one kind of link and it points downwards.

**Traversal is rigid.** Because there is only one path to any node - down from the root - every lookup is a walk. In a small tree that costs nothing. In a page with ten thousand DOM nodes it costs enough that React maintains a **virtual DOM** *[a copy of the tree held in memory, compared against the previous version so that only the changed parts are written to the real DOM]* rather than searching and rewriting the real one directly.

The result is a model that is excellent at categorisation and bad at relationships.

> A tree can say what something belongs to. It cannot say what something is connected to.

## 4. The network model

### 4.1 The shape

A **network** is a collection of items and the connections between them. The vocabulary:

- **Nodes** (also called **vertices**) are the objects in the network.
- **Edges** (also called **links**) are the relationships between nodes.
- Edges can have **directionality**. An edge from A to B is not necessarily the same as an edge from B to A, and a network can have one without the other.
- Edges can carry **values**, usually called **weights**. A weight can mean strength of connection, cost, distance, time, probability - whatever the relationship needs to record.

Dropping the single-parent rule is what makes the network model different. Any node can connect to any other node, so `M:M` *[many-to-many - each side of the relationship can have many of the other]* is expressible directly. So is a node connecting back to itself.

Weights change what a link is for. In a tree, a link carries no information beyond "this is inside that". In a network, a link is somewhere to store data, and in several of the examples below it is the only place the data lives.

### 4.2 Networks you already use

The **internet** is a network of connected devices, which is where the name comes from.

**Cloud infrastructure** is a network. The regions, availability zones and data centres from last module are nodes, and the links between them have real weights - latency, bandwidth, transfer cost.

A **neural network** is a network, and it is the one behind the tools you use every day.

### 4.3 Aside: how a neural network uses those weights

Outside the scope of this module.

A neural network is arranged in layers: an **input layer**, one or more **hidden layers**, and an **output layer**. Every node in a layer connects forward to every node in the next layer, and every one of those connections has a weight. Each node also has a **bias**, a value added on top of what arrives.

Data enters at the input layer. At each node, the incoming values are multiplied by their connection weights, summed, and the bias added. The result goes through an **activation function**, which decides whether and how strongly that node fires. Its output propagates forward to the next layer, and so on until the output layer produces an answer.

That answer is evaluated against a **cost function** *[a measure of how wrong the output was]*. A larger cost means a larger correction, and the correction is pushed backwards through the network - **backpropagation** - adjusting the weights and biases so that the same input produces a better answer next time. Train it on enough data and the weights settle into values that produce useful answers.

A large language model is this shape with vastly more of everything - more layers, more nodes, more weights - plus architectural machinery on top that we are not covering. The thing being trained underneath is still a weighted network.

## 5. A network worth drawing: airports

The worked example was a transport network of airports, on [board 05](boards/05-network-example-airports.jpeg). Oslo in the middle, Bergen and Trondheim off it, then London, Paris, Berlin, Madrid, Rome, Istanbul, and across the Atlantic to New York, Toronto and Miami. Nodes are airports. Edges are the routes that actually exist between them.

### 5.1 Routes and reroutes

Ask the network a question: how do I get from Oslo to Rome? Trace the edges and there is more than one answer - via Paris, via Berlin, via London and Madrid. A tree would have given you one path, because a tree only has one path. A network gives you a set of them, and now you have something to choose between.

Then break a link. Paris to Rome is down. In a tree, removing a link removes everything under it from reach. In the network, the other routes are still there and the question becomes which of the remaining ones to take. That is the practical reason transport, logistics and routing are modelled as networks and not as hierarchies.

### 5.2 Direction and weight

Each route on the board carries the flying time. London to New York is around 9 hours; New York to London is around 8, because of the jet stream. Same two nodes, two edges, different weights depending on direction.

This is the difference between a **directed** and an **undirected** edge made concrete. If the relationship is genuinely symmetric, one undirected edge will do. The moment the two directions differ in any value you care about, you need two edges, each with its own weight.

### 5.3 Reading the graph

Once the network is drawn, it answers questions nobody explicitly stored answers to. Counting edges per node finds the hubs: Oslo has five connections, London four, Paris three, New York three. Nobody wrote down "Oslo is a hub". The shape of the connections is itself data.

### 5.4 Aside: the most efficient route

Outside the scope of this module.

Once you have a weighted network, the next question is the cheapest route through it, and the famous version of that question is the **travelling salesman problem**: visit every city once, return to the start, minimise the total distance. It is easy to state and hard to solve. The number of possible routes grows so fast with the number of cities that checking them all stops being feasible at quite small sizes, so in practice you do not search for the guaranteed best answer, you search for a good one.

One approach is a **genetic algorithm**: generate a population of candidate routes, keep the better ones, combine and randomly mutate them to make the next generation, and repeat. It has its own parameters to tune - how much of the population survives each generation, how often a mutation happens - and those choices change the answer you get.

The same failure mode shows up here and in neural network training. A search like this can settle into a **local minimum** *[a solution better than everything immediately around it, but not the best solution overall]* and report it as the answer, because from where it is standing every direction looks worse. Adjust too aggressively and you step straight over the **global minimum**; adjust too timidly and you never leave the local one. How likely this is depends on the data, how much of it there is, and how complex a model you are fitting to it - the same set of trade-offs that decides whether a model generalises or just memorises its training data.

## 6. Your turn

This is the activity we ran in class. Do it before reading section 7.

Find one example of a **tree** and one example of a **network** that were not used in this lesson. For each:

- Give it at least six data points, so the structure has something to hold.
- Say why that structure fits the data.
- Find a limitation. What does the data need to express that the structure cannot?

Research it however you like, and draw both.

## 7. What the class drew

Three examples came back to the board.

### 7.1 Potatoes: a clean tree

The first group classified potatoes by how they cook ([board 07](boards/07-potatoe-tree.jpeg)).

- **Potatoes**
  - **Melne** *[floury, high dry matter - falls apart when boiled]*
    - Kerrs Pink
    - Gullauge
    - Mandel
  - **Halvkokefaste** *[between the two]*
    - Beate
  - **Kokefaste** *[firm, holds its shape when boiled]*
    - Asterix
    - Folva
    - Amandine

Three levels, and like the taxonomy each level means something different. The root is the crop. The middle level is the **cooking type**, a real ranked property - Norwegian growers grade potatoes on a scale from fastkokende (firm) through middels melen to melen (floury), and that grade is what decides whether a variety ends up in mash or in a salad. The bottom level is the variety itself.

It works as a tree because each variety sits in exactly one cooking type, and because the varieties have nothing to say to each other. Kerrs Pink and Folva are not related in any way this data cares about. Strict `1:M`, no cross-links needed, no strain on the model.

### 7.2 Weather: a network with probabilities

The second example was a **Markov chain** ([board 08](boards/08-network-markov-chain.jpeg)), brought in by a student who had met them in previous study.

The nodes are weather states: sunny, cloudy, rainy, snowy, foggy, stormy. The edges are "what happens tomorrow", and the weight on each edge is the probability of that transition. Given that today is sunny, there is some probability of sunny again tomorrow (the edge from a node back to itself), some probability of cloudy, some of rainy, and so on. The probabilities leaving any one node add up to 1.

This uses every feature of the network model at once. The relationships are many-to-many, since any state can lead to any other. They are directed, and the direction matters: the probability of rain given sun is not the probability of sun given rain. And the weight carries everything - the nodes are six words, all of the information is on the edges.

It is a different thing from the neural network in 4.3, even though both are weighted directed graphs. Here the weights are probabilities and the nodes are states, not data being transformed.

The limitation the class found is the interesting part. The chain only knows today. It has no way to express "it has been sunny for three days running, so rain is getting more likely", because the next state depends only on the current state and nothing before it. That restriction is called the **Markov property**, and it is what makes these chains simple enough to compute with. Getting history into the model means changing the model, not adding more edges.

### 7.3 Game assets: the tree's limit, in production

The third example came from a student who does game development.

Game engines organise a project as a tree ([board 09](boards/09-tree-game-dev-limits.jpeg)). `Assets` at the root, `Models` beneath it, `Player` and `NPC` beneath that, and under each of those the scripts that give it behaviour - including a `Jump` script.

Both the player and the NPC jump. It is the same jump. But `Player` and `NPC` are separate branches, and a tree has no way for one branch to point at another. So `Jump` gets attached under `Player`, and a second copy gets attached under `NPC`. Put a hundred NPCs in the scene and the tree contains a hundred copies of the same behaviour.

The tree is not doing anything wrong. It is doing exactly what it promises: everything hangs off exactly one parent, so everything can be found by walking down from the root. That guarantee is why the structure is easy to navigate, and it is the same guarantee that forbids `NPC` from reaching sideways to borrow the player's jump. There is no import, no export, no reference to elsewhere. Down is the only direction.

This is the DOM problem in a different room. It is why React re-renders whole subtrees, and why you end up reaching for memoisation and references to stop work you did not ask for. Different domain, same structure, same limitation.

What both cases want is an edge - a link from this node to that node, carrying the meaning "uses". That is not something a tree can express. It is the first thing a network can.

> A hundred NPCs means a hundred copies of the same jump.

## 8. Sources

1. IBM, *Information Management System* - [ibm.com/history/information-management-system](https://www.ibm.com/history/information-management-system)
2. MDN Web Docs, *Introduction to the DOM* - [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
3. Britannica, *Taxon* - [britannica.com/science/taxon](https://www.britannica.com/science/taxon)
4. Britannica, *Taxonomy: Ranks* - [britannica.com/science/taxonomy/Ranks](https://www.britannica.com/science/taxonomy/Ranks)
5. Britannica, *Traveling salesman problem* - [britannica.com/science/traveling-salesman-problem](https://www.britannica.com/science/traveling-salesman-problem)
6. Fagforum Potet, *Potetsorter og egnethet i matlaginga* - [potet.no](https://potet.no/fakta-om-potet/potetsorter-og-egnethet-i-matlaginga)
7. GeeksforGeeks, *Introduction to Tree Data Structure* - [geeksforgeeks.org](https://www.geeksforgeeks.org/dsa/introduction-to-tree-data-structure/)
8. GeeksforGeeks, *Markov Chain* - [geeksforgeeks.org/machine-learning/markov-chain](https://www.geeksforgeeks.org/machine-learning/markov-chain/)
