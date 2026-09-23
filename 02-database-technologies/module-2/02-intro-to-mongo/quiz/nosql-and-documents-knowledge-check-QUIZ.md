# NoSQL and the Document Model - Knowledge Check

This quiz is based on the Introduction to NoSQL and the Document Model lesson, with the questions grouped into topics.

Question **14** is marked *(beyond the lessons)*. It goes past what we covered directly and is meant to be reasoned out from what you do know. Everything else is in the lecture notes.

## Different approaches

**1.** A team is modelling a veterinary clinic. One developer opens by listing the entities and the lines between them - an owner has many pets, a pet has many visits. Another opens by asking what the pet profile screen has to put on the page in one go. What characterises the second approach?

- **A.** It designs around the relationships in the data, and derives the screens from them.
- **B.** It designs around the access patterns, so data read together is stored together.
- **C.** It avoids duplication, so each fact is stored in exactly one place.
- **D.** It postpones the shape until the data arrives, so nothing has to be decided up front.

**2.** A parcel company's relational database is normalized to third normal form. A depot changes its name. How many places does that change have to be made, and why?

- **A.** One, because normalization exists so that one fact lives in one place.
- **B.** One, because a transaction rolls back any update that would leave duplicates behind.
- **C.** Every table that stores a depot name, because normalization splits data across tables.
- **D.** Every row that references the depot, because the foreign key holds a copy of the name.

**3.** A reporting team is asked a question nobody anticipated when the system was built: which instructors have had a course cancelled twice in the same term? The data sits in a document database shaped around the course listing page. What makes this harder than it would have been relationally?

- **A.** Document databases cannot express a query with more than one condition in it.
- **B.** The data carries no field names, so the reporting tool has nothing to filter on.
- **C.** Referential integrity is not enforced, so the numbers coming back cannot be trusted.
- **D.** The documents were shaped around the questions, and this one was not among them.

---

## Documents, `_id` and Duplication

**4.** A podcast app's episode page shows the episode, the show it belongs to, and the transcript. Relationally that is three tables and three fetches stitched together in the application. In the document version the show and the transcript sit inside the episode document. What has changed at request time?

- **A.** The database performs the join internally instead of the application doing it.
- **B.** The data comes back in one read, already in the shape the page needs.
- **C.** The three fetches still happen, but the database runs them in parallel.
- **D.** The application fetches the episode, then follows two references to complete it.

**5.** A ride-hailing company splits its `trips` collection across five machines, each holding part of the data. Why does the database generate a 12-byte identifier rather than a number that counts up?

- **A.** A 12-byte value holds far more distinct identifiers than an integer can.
- **B.** A hexadecimal identifier is harder for an outsider to guess than a sequential one.
- **C.** Each machine can generate one on its own, without asking the others anything.
- **D.** The identifier records which machine the document is on, so a lookup skips the rest.

**6.** A recipe site embeds the author's name inside every recipe document. An author changes their display name. Nothing in the database reports a problem, yet a week later a search for the new name returns only some of their recipes. What happened?

- **A.** Some documents still carry the old name, and nothing exists to tell you which were missed.
- **B.** The update was rolled back partway, leaving half the documents unchanged.
- **C.** The reference from recipe to author was left pointing at a record that no longer exists.
- **D.** The author document and the recipe documents disagree, so only the consistent ones came back.

---

## Embedding or Referencing

**7.** A weather service stores one document per sensor, with every reading embedded in it. Each sensor has produced a reading every minute for two years. Fetching a sensor's current status is now slow. What is the design problem?

- **A.** The readings should have been embedded as an object rather than as an array.
- **B.** Two years of readings is more than a single collection is able to hold.
- **C.** The readings have no `_id` of their own, so they cannot be addressed individually.
- **D.** The sensor document is unbounded, so every read drags the whole history along.

**8.** A job board is deciding whether to embed applications inside the job posting document. Applications appear on the job page, but there is also a "my applications" page for each candidate and a moderation queue spanning every posting. Which fact argues hardest against embedding?

- **A.** Applications are read on the job page alongside the posting itself.
- **B.** Applications are wanted on their own, without the posting.
- **C.** Applications carry more fields than the posting they would sit inside.
- **D.** Applications are written far more often than postings are.

**9.** A music festival app keeps `artists` and `setTimes` in separate collections, each set time holding an `artistId`. An artist is removed from the roster. What does the database do about the set times pointing at them?

- **A.** It deletes them, because removing the referenced document cascades to them.
- **B.** It refuses the delete, because set times still reference that artist.
- **C.** It leaves them, because nothing checks that `artistId` points at anything.
- **D.** It leaves them, but marks them so the application can repair them later.

---

## Flexible Schemas

**10.** A library system's `members` collection is written to by two teams. One writes `joinedAt`, the other writes `dateJoined`. A report listing everyone who joined this year runs without error and comes back missing half of them. What is this?

- **A.** Schema drift
- **B.** An orphaned record
- **C.** Eventual consistency
- **D.** A failed transaction

**11.** A team picks a document database partly because they do not have to declare a structure before storing anything. Six months in, the same validation rules have been written out in four different routes. What does that show about the schema?

- **A.** The schema was never needed, since the application works without one.
- **B.** The rules did not disappear, they moved into the application.
- **C.** The database has silently built a schema from the documents already stored.
- **D.** The collection needs normalizing so that the rules apply in one place.

---

## Kinds of Data, and the Other Families

**12.** A security company stores hours of camera footage, alongside one record per camera holding its id, location and model. Which describes the footage?

- **A.** Semi-structured, because each file carries its own metadata with it.
- **B.** Structured, because every file is in the same format.
- **C.** Unstructured, because it carries no field names to query on.
- **D.** Semi-structured, because the camera record describes it.

**13.** A booking service keeps each user's seat availability in its own in-memory cache. A seat is sold through a different service entirely. The booking service goes on showing that seat as free. What is being described?

- **A.** The cache is serving data that no longer matches the real data.
- **B.** The cache has run out of memory and is answering from an incomplete copy.
- **C.** The two services disagree because neither enforces referential integrity.
- **D.** The key-value store cannot hold structured values, so the seat state was lost.

---

## Beyond the Lessons

**14. *(beyond the lessons)*** A payments service moves money between two documents in separate collections - one debited, one credited. Nothing in the document model guarantees that both happen. Given what the relational model offers for this, what would a document database have to add?

- **A.** Referential integrity, so neither document can be deleted while the other exists.
- **B.** A fixed schema, so that both documents are validated on every write.
- **C.** Eventual consistency, so that the two documents agree after a short delay.
- **D.** Multi-document transactions, so both writes commit together or neither does.
