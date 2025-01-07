const express= require("express");
const books = require('./data/books');
const { connectToDatabase, sql } = require("./dbconfig");

//initialization 
const app = express()

//application will use json format data only
app.use(express.json())

//const list= ["today ","gonna ","have ","awesome ","party"]

const port= 8081;
// app.get('/add', (req, res) => {
//     const { num1, num2 } = req.body;

//     if (!num1 || !num2) {
//         return res.status(400).json({ error: 'Please provide num1 and num2 as query parameters' });
//     }

//     const sum = parseInt(num1) + parseInt(num2);
//      res.status(200).json({ result: sum });
// });
//    app.get('/', (req,res) =>{
//     res.status(200).send(list)
//    });

//    app.post('/list', (req, res) =>{
//      let newlist=req.body.item;
//      list.push(newlist);
//       res.status(200).send({message:"the list is updated successfully "})

//    })

    // Initialize database connection
let pool;
(async () => {
  try {
    pool = await connectToDatabase();
  } catch (error) {
    console.error("Failed to initialize database connection:", error.message);
  }
})();

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
     
    //price validation 
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

   


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

