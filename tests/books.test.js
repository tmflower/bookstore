process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBook;

beforeEach( async() => {
    let result = await db.query(
        `INSERT INTO books
        (isbn,
        amazon_url,
        author,
        language,
        pages,
        publisher,
        title,
        year)
        VALUES
        ('0691161518',
        'http://a.co/eobPtX2',
        'Matthew Lane',
        'english',
        264,
        'Princeton University Press',
        'Power-Up: Unlocking the Hidden Mathematics in Video Games',
        2017) RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`
    );
    testBook = result.rows[0];
});


afterEach( async() => {
    await db.query(`DELETE FROM books`);
});


afterAll( async() => {
    await db.end();
});


describe("GET /books", () => {
    test('get list of all books', async() => {
        const response = await request(app).get(`/books`);        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({books: [testBook]});
    });
});

describe("GET /books/:id", () => {
    test('get single book by isbn', async() => {
        const response = await request(app).get(`/books/${testBook.isbn}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({book: testBook});
    });
    test('responds with 404 if isbn is not in db', async() => {
        const response = await request(app).get(`/books/12345`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /books", () => {
    test('creates a new book', async() => {
        const response = await request(app).post(`/books`).send(
            {isbn: '12345678',
            amazon_url: 'http://a.co/abcde',
            author: 'Sadie Kat',
            language: 'french',
            pages: 999,
            publisher: 'Meow Press',
            title: 'I Want Kibble',
            year: 2022
            }); 
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({book:
            {isbn: '12345678',
            amazon_url: 'http://a.co/abcde',
            author: 'Sadie Kat',
            language: 'french',
            pages: 999,
            publisher: 'Meow Press',
            title: 'I Want Kibble',
            year: 2022
            }});
    });
    test('provides error feedback when required data is missing', async() => {
        const response = await request(app).post(`/books`).send(
            {isbn: '12345678',
            amazon_url: 'http://a.co/abcde',
            author: 'Sadie Kat',
            language: 'french',
            pages: 999,
            publisher: 'Meow Press',
            year: 2022
            });
            expect(response.statusCode).toEqual(400);
            expect(response.body).toEqual({
                error: { message: [ 'instance requires property "title"' ], status: 400 },
                message: [ 'instance requires property "title"' ]
              });
    });
    test('provides error feedback when data is wrong type', async() => {
        const response = await request(app).post(`/books`).send(
            {isbn: '12345678',
            amazon_url: 'http://a.co/abcde',
            author: 'Sadie Kat',
            language: 54,
            pages: '999',
            publisher: 'Meow Press',
            title: 'Forever Hungry: A Passion for Kibble',
            year: 2022
            });
            expect(response.statusCode).toEqual(400);
            expect(response.body).toEqual({
                error: { message: [ 'instance.language is not of a type(s) string', 'instance.pages is not of a type(s) integer' ], status: 400 },
                message: [ 'instance.language is not of a type(s) string', 'instance.pages is not of a type(s) integer' ]
                });
    });
});

describe("PUT /books/:isbn", () => {
    test('updates information for book of specified isbn', async() => {
        const response = await request(app).put(`/books/${testBook.isbn}`).send({
            isbn: '0691161518',
            amazon_url: 'http://www.amazon.com',
            author: 'Sam I Am',
            language: 'Swahili',
            pages: 888,
            publisher: 'Bess Press',
            title: 'dakine', 
            year: 1578});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({book: {
            isbn: '0691161518',
            amazon_url: 'http://www.amazon.com',
            author: 'Sam I Am',
            language: 'Swahili',
            pages: 888,
            publisher: 'Bess Press',
            title: 'dakine', 
            year: 1578}});
    });
    test('responds with 404 if isbn is not in db', async() => {
        const response = await request(app).put(`/books/12345`).send({
            isbn: '0691161518',
            amazon_url: 'http://www.amazon.com',
            author: 'Sam I Am',
            language: 'Swahili',
            pages: 888,
            publisher: 'Bess Press',
            title: 'dakine', 
            year: 1578});
        expect(response.statusCode).toEqual(404);
    });
    test('provides error feedback when data is wrong type', async() => {
        const response = await request(app).put(`/books/${testBook.isbn}`).send(
            {isbn: '0691161518',
            amazon_url: 'http://www.amazon.com',
            author: 1,
            language: 1,
            pages: '888',
            title: 1,
            year: 1578
            });
            expect(response.statusCode).toEqual(400);
            expect(response.body).toEqual(    {
                error: {
                    message: [
                    'instance requires property "publisher"',
                    'instance.author is not of a type(s) string',
                    'instance.language is not of a type(s) string',
                    'instance.pages is not of a type(s) integer',
                    'instance.title is not of a type(s) string'
                    ],
                    status: 400
                },
                message: [
                    'instance requires property "publisher"',
                    'instance.author is not of a type(s) string',
                    'instance.language is not of a type(s) string',
                    'instance.pages is not of a type(s) integer',
                    'instance.title is not of a type(s) string'
                ]
                });
    });
});

describe("DELETE /books/:id", () => {
    test('delete a single book by isbn', async() => {
        const response = await request(app).delete(`/books/${testBook.isbn}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ message: "Book deleted" });
    });
    test('responds with 404 if isbn is not in db', async() => {
        const response = await request(app).delete(`/books/12345`);
        expect(response.statusCode).toEqual(404);
    });
});