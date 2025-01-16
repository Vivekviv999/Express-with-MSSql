const express = require("express");
const { connectToDatabase, sql } = require("./dbconfig");
const axios = require("axios");

// Initialization
const app = express();
app.use(express.json());

const port = 8081;

// Initialize database connection
let pool;
(async () => {
  try {
    pool = await connectToDatabase();
  } catch (error) {
    console.error("Failed to initialize database connection:", error.message);
  }
})();

// Existing endpoints
app.get("/books", async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM Books"); // Replace 'Books' with your table name
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching books:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/update-book", async (req, res) => {
  const { id, name, author, genre, price, publisher } = req.body;

  // Price validation
  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ error: "Invalid price: Only positive numbers are allowed" });
  }

  try {
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("author", sql.NVarChar, author)
      .input("genre", sql.NVarChar, genre)
      .input("price", sql.Decimal(10, 2), price)
      .input("publisher", sql.NVarChar, publisher)
      .query(
        "UPDATE Books SET name = @name, author = @author, genre = @genre, price = @price, publisher = @publisher WHERE id = @id"
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    console.error("Error updating book:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// New endpoint: /getAdditionalBookData
app.post("/getFirstPublishedYear", async (req, res) => {
  const { title } = req.body;

  // Validate input
  if (!title) {
    return res.status(400).json({ error: "Book title is required" });
  }

  try {
    console.log("Fetching data for book title:", title);

    // Trim and encode the title
    const trimmedTitle = title.trim();
    const encodedTitle = encodeURIComponent(trimmedTitle);

    // Prepare the database query
    const dbQueryPromise = pool
      .request()
      .input("title", sql.NVarChar, trimmedTitle)
      .query("SELECT author, price, publisher FROM Books WHERE LOWER(name) = LOWER(@title)");

    // Prepare the API request
    const apiRequestPromise = axios.get(`https://openlibrary.org/search.json?q=${encodedTitle}`);

    // Execute both promises concurrently
    const [dbResult, apiResponse] = await Promise.all([dbQueryPromise, apiRequestPromise]);

    // Handle database response
    if (dbResult.recordset.length === 0) {
      return res.status(404).json({ error: "No matching book found in the database" });
    }
    const bookData = dbResult.recordset[0];

    // Handle API response
    const docs = apiResponse.data.docs;
    if (!docs || docs.length === 0) {
      return res.status(404).json({ error: "No books found in the Open Library API" });
    }
    const firstPublishedYear = docs[0].first_publish_year;

    if (!firstPublishedYear) {
      return res.status(404).json({ error: "First published year not available" });
    }

    // Combine database and API data into a single response
    const combinedData = {
      title: trimmedTitle,
      ...bookData,
      firstPublishedYear,
    };

    // Send the combined response
    res.status(200).json(combinedData);
  } catch (error) {
    console.error("Error occurred while processing the request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
