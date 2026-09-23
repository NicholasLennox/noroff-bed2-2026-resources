# NoSQL and the Document Model - Knowledge Check - Answer Key

Read this against your own answers. Each entry gives the correct option, why it is correct, and what a particular wrong choice usually means.

Question **14** is marked *(beyond the lessons)*. Getting it wrong tells you nothing except that you have not met it yet; read the answer as the guidance it is meant to be.

### Different approaches

**1. B - It designs around the access patterns, so data read together is stored together.**

The second developer is asking what the application needs handed to it in one go, which is a question about access patterns rather than about relationships.

If you chose **A**, that is the first developer - entities first, then the lines between them. If you chose **D**, you have picked up the flexible schema instead. Not having to declare a structure up front is a separate property of the database; it is not the same as designing around what gets read together, and you can have one without the other.

§3, *A different starting question*.

**2. A - One, because normalization exists so that one fact lives in one place.**

The name is stored once, in the depot row, and every query that needs it reaches it from there. That is what normalizing to third normal form buys you, and it is exactly what the document model gives up.

If you chose **D**, you have the foreign key storing the value rather than an identifier that points at it. A foreign key holds the key, not a copy of the data, which is why the update only has to land in one place.

§2, *What SQL is built for*.

**3. D - The documents were shaped around the questions, and this one was not among them.**

A relational schema is designed around the data, so a new question is usually a new query. A document schema is designed around the questions, so a question outside that set can mean changing the documents themselves, and there may be millions of them.

If you chose **C**, you have named a real cost of the document model, but it is the wrong one here - missing referential integrity makes references unreliable, it does not make an unanticipated query hard to write.

§6, *What each one costs*.

### Documents, `_id` and Duplication

**4. B - The data comes back in one read, already in the shape the page needs.**

The show and the transcript are embedded, so there is no key to follow and nothing to stitch together. One read returns the page's data.

If you chose **D**, you have described referencing rather than embedding - that is what happens when the episode holds a `showId` instead of the show. If you chose **A**, you have the database doing the join for you. Nothing joins, because nothing was separated.

§3.1, *A movie as a document*.

**5. C - Each machine can generate one on its own, without asking the others anything.**

A counter shared across five machines needs the machines to agree on the next number, on every single insert. An ObjectId is built to be unique without anyone being consulted, so the coordination never has to happen.

If you chose **D**, you have given the identifier a job it does not have. It carries no routing information, and it does not need to - the point is that generating it requires no knowledge of the other machines at all.

§3.2, *Why `_id` is not a number*.

**6. A - Some documents still carry the old name, and nothing exists to tell you which were missed.**

The name is duplicated into every recipe, so changing it means changing it everywhere, and no part of the database is tracking whether you got them all. The failure never surfaces as an error, only as results that are quietly incomplete.

If you chose **D**, you have the database comparing documents and filtering the results. It does no such thing - it returned every document matching the name you searched for, and the rest simply do not match any more.

§3.3, *Duplication is expected*.

### Embedding or Referencing

**7. D - The sensor document is unbounded, so every read drags the whole history along.**

A million readings inside one document means a million readings come back every time you want the current status. Embedding is fine while the cardinality is bounded and small; here it grows every minute forever, which is the case for giving readings their own collection.

If you chose **B**, you have invented a limit that is not the problem. The collection will hold it. The cost is paid on every read of that one document.

§4, *Embedding or referencing*.

**8. B - Applications are wanted on their own, without the posting.**

The access pattern question comes first, and two of the three screens want applications without the posting. Something embedded can only be reached through its parent, so a "my applications" page and a moderation queue both become awkward.

If you chose **D**, write frequency is a real consideration but it is not the one that decides this. If you chose **A**, that is the argument for embedding, not against it.

§4, *Embedding or referencing*.

**9. C - It leaves them, because nothing checks that `artistId` points at anything.**

Nothing declares that `artistId` refers to the `artists` collection, so the database has no reason to act. The set times are now orphans, and keeping references valid is the application's job.

If you chose **A** or **B**, you are expecting a guarantee the relational model made and this one does not. Cascading deletes and rejected deletes both require the database to know the relationship exists, and here it does not.

§4, *Embedding or referencing*.

### Flexible Schemas

**10. A - Schema drift**

Two documents in one collection have diverged in shape, nothing stopped them, and the query is looking for a field half of them do not have. The tell is that there is no error - the report runs perfectly and is wrong.

If you chose **C**, eventual consistency is about copies of data catching up with each other after a delay. Waiting longer would not help here; the documents are never going to agree.

§5.1, *Flexible schemas, and where the rules go*.

**11. B - The rules did not disappear, they moved into the application.**

A shape is still being enforced - four times over, in four routes, with four chances to get it wrong. Not declaring the rules in the database did not remove them, it moved them somewhere with no single place to change them.

If you chose **D**, normalization is about where data lives, not where validation lives, so it does not address the duplication being described.

§5.1, *Flexible schemas, and where the rules go*.

### Kinds of Data, and the Other Families

**12. C - Unstructured, because it carries no field names to query on.**

Video has no field names travelling with the values, and nothing in it can be filtered the way a column can. The camera records alongside it are structured, which is what makes the pairing worth looking at - the two sit in different categories.

If you chose **A** or **D**, you are letting a description of the footage make the footage itself semi-structured. Semi-structured means the data carries its own field names; a separate record describing it is not the same thing.

§7, *Three kinds of data*.

**13. A - The cache is serving data that no longer matches the real data.**

The data went stale. The sale happened somewhere that has no way of telling this cache about it, and knowing when to clear a cache is the hard half of the problem, not the clearing itself.

If you chose **C**, referential integrity is about a reference pointing at something that exists. Both records here are fine; one copy is just out of date.

§8, *The other families*.

### Beyond the Lessons

**14. D - Multi-document transactions, so both writes commit together or neither does.**

The guarantee you want is the A in ACID - all of it happens or none of it does. Embedding both sides in one document would give you that for free, since a single document write is already all-or-nothing, but two collections means two writes, and something has to bind them together.

MongoDB does support multi-document transactions, added in version 4.0. They come with a cost in performance and complexity, and the usual advice is to reach for them only when the data genuinely cannot be modelled together in one document.

If you chose **C**, eventual consistency is a description of a delay, not a guarantee about completeness. It says the copies will agree in the end; it says nothing about whether both writes happened at all.
