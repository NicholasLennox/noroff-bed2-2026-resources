// Import MongoDB
const { MongoClient } = require('mongodb')

// Get connection string
const connectionString = 'mongodb://localhost:27017/' // IPv4 (127.0.0.1) vs IPv6 (::1) (MongoServerSelectionError: connect ECONNREFUSED ::1:27017)

// Create the client
const client = new MongoClient(connectionString, {family: 4})

// Scaffold main function
async function main() {
    try {
        // Connect to server
        await client.connect()
        console.log('Connected!');

        // Select DB (not created until something is inserted)
        const db = client.db('bookstore')

        // Create collection
        const books = await db.createCollection('books')
        console.log('Collection created!');
        await books.deleteMany({}) // Truncate

        // Insert many books (different shapes, some with embedded data)
        await books.insertMany([
            {title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genres: ['fantasy', 'adventure']},
            {title: '1984', author: {name: 'George Orwell', born: 1903, country: 'UK'}, year: 1949, inStock: true},
            {title: 'Neuromancer', author: 'William Gibson', price: 149.99, tags: ['cyberpunk', 'sci-fi']},
            {title: 'The Name of the Wind', author: 'Patrick Rothfuss', series: {name: 'The Kingkiller Chronicle', book: 1}},
            {title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', pages: 464},
            {title: 'Sapiens', author: 'Yuval Noah Harari', reviews: [
                {user: 'kari', rating: 5, comment: 'Changed how I think about history'},
                {user: 'ola', rating: 3}
            ]},
            {title: 'The Pragmatic Programmer', authors: ['Andrew Hunt', 'David Thomas'], edition: 2, year: 2019},
            {title: 'Norwegian Wood', author: 'Haruki Murakami', translation: {from: 'Japanese', translator: 'Jay Rubin'}},
            {title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', stock: {oslo: 12, bergen: 4}, price: 199},
            {title: 'The Martian', author: 'Andy Weir', year: 2011, genres: ['sci-fi'], adaptations: [{type: 'film', year: 2015}]}
        ])

        // Read books
        const allBooks = await books.find().toArray()
        // console.log(allBooks);
        
        // Chain of command design pattern. 
        const recent = await books.find({year: { $gt: 2000}})
                        .project({title: 1, year: 1})
                        .toArray() // Terminator

        console.log(recent);
        
        

    } catch(error) {

        console.error(error)

    } finally {
        await client.close()
    }
    
}

main()