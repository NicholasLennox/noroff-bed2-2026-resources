// Import ObjectId, client, books collection and seed
const { ObjectId } = require('mongodb')
const { client, books } = require('./data/db.js')
const { seed } = require('./data/seed.js')

// Main function
async function main() {
    try {
        await client.connect()

        await seed()

        const allBooks = await getAll()
        console.log(allBooks);

        const newerBooks = await getAfterYear(2000)
        console.log(newerBooks);

        // Round trip: insert, then read it back by its new _id
        const id = await insert({ title: 'Dune', author: 'Frank Herbert', year: 1965 })
        const dune = await getById(id)
        console.log(dune);

    } catch (error) {
        console.error(error);
    } finally {
        await client.close()
    }
}

async function getAll() {
    return await books.find().toArray()
}

async function getAfterYear(year) {
    return await books.find({ year: { $gt: year } })
        .project({ title: 1, year: 1 })
        .toArray() // Terminator
}

async function getById(id) {
    return await books.findOne({ _id: new ObjectId(id) })
}

async function insert(book) {
    const result = await books.insertOne(book)
    return result.insertedId
}

main()
