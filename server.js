// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3006;

// PostgreSQL database connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '123456',
    port: 5432,
});

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create tables if not exists and insert initial values
pool.query(`
    CREATE TABLE IF NOT EXISTS language (
        language_id SERIAL PRIMARY KEY,
        language_name VARCHAR(50) UNIQUE
    );
    CREATE TABLE IF NOT EXISTS question (
        question_id SERIAL PRIMARY KEY,
        language_id INT,
        question_text VARCHAR(255),
        FOREIGN KEY (language_id) REFERENCES language(language_id)
    );
    CREATE TABLE IF NOT EXISTS option (
        option_id SERIAL PRIMARY KEY,
        question_id INT,
        option_text VARCHAR(255),
        FOREIGN KEY (question_id) REFERENCES question(question_id)
    );
    CREATE TABLE IF NOT EXISTS response (
        response_id SERIAL PRIMARY KEY,
        language_id INT
    );
    CREATE TABLE IF NOT EXISTS response_details (
        id SERIAL PRIMARY KEY,
        question_id INT,
        option_id INT,
        response_id INT,
        FOREIGN KEY (question_id) REFERENCES question(question_id),
        FOREIGN KEY (option_id) REFERENCES option(option_id),
        FOREIGN KEY (response_id) REFERENCES response(response_id)
    );
    INSERT INTO language (language_name) VALUES 
        ('Uttar Pradesh'),
        ('Maharastra'),
        ('Bihar'),
        ('Madhya Pradesh');
    -- Insert questions for uttar Pradesh
    INSERT INTO question (language_id, question_text) VALUES
        (1, 'classical dance?'),
        (1, 'Language?');

    -- Insert questions for Maharastra
    INSERT INTO question (language_id, question_text) VALUES
          (2, 'classical dance?'),
          (2, 'Language?');

    -- Insert questions for Bihar
    INSERT INTO question (language_id, question_text) VALUES
           (3, 'classical dance?'),
           (3, 'Language?');

    -- Insert questions for Madhya Pradesh
    INSERT INTO question (language_id, question_text) VALUES
           (4, 'classical dance?'),
           (4, 'Language?');

    -- Insert options for Uttar pradesh questions
    INSERT INTO option (question_id, option_text) VALUES
        (1, 'Singhi Chham '),
        (1, 'Kathak');

    INSERT INTO option (question_id, option_text) VALUES
        (2, 'Hindi'),
        (2, 'Bengali');

    -- Insert options for Maharastra questions
    INSERT INTO option (question_id, option_text) VALUES
        (3, ' Lavani'),
        (3, 'Tertali');

    INSERT INTO option (question_id, option_text) VALUES
        (4, ' Urdu'),
        (4, ' Marathi');

    -- Insert options for Bihar questions
    INSERT INTO option (question_id, option_text) VALUES
        (5, 'Kathak'),
        (5, 'Lavani');

    INSERT INTO option (question_id, option_text) VALUES
        (6, 'Malavi'),
        (6, 'Bhojpuri');

    -- Insert options for Madhya pradesh questions
    INSERT INTO option (question_id, option_text) VALUES
        (7, 'Tertali'),
        (7, 'Bhangra');

    INSERT INTO option (question_id, option_text) VALUES
        (8, 'Bundeli'),
        (8, 'Magahi');
`, (error, results) => {
    if (error) {
        console.error('Error creating tables and inserting initial values:', error);
    } else {
        console.log('Tables created and initial values inserted successfully');
    }
});

// Route to fetch state
app.get('/languages', (req, res) => {
    pool.query('SELECT * FROM language', (error, results) => {
        if (error) {
            console.error('Error fetching languages:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results.rows);
    });
});

// Route to fetch questions for a specific language
app.get('/questions/:languageId', (req, res) => {
    const languageId = req.params.languageId;
    pool.query('SELECT * FROM question WHERE language_id = $1', [languageId], (error, results) => {
        if (error) {
            console.error('Error fetching questions:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        const questions = results.rows;
        const questionIds = questions.map(question => question.question_id);
        // Fetch options for each question
        fetchOptions(questionIds)
            .then(optionsMap => {
                questions.forEach(question => {
                    question.options = optionsMap[question.question_id];
                });
                res.json(questions);
            })
            .catch(err => {
                console.error('Error fetching options:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
    });
});

// Function to fetch options for questions
async function fetchOptions(questionIds) {
    const optionsMap = {};
    for (const questionId of questionIds) {
        const options = await pool.query('SELECT * FROM option WHERE question_id = $1', [questionId]);
        optionsMap[questionId] = options.rows;
    }
    return optionsMap;
}

// Route to handle form submissions
app.post('/submit-response', (req, res) => {
    const { languageId, responses } = req.body;

    // Insert response into database
    pool.query('INSERT INTO response (language_id) VALUES ($1) RETURNING response_id', [languageId], (error, result) => {
        if (error) {
            console.error('Error inserting response:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        const responseId = result.rows[0].response_id;
        // Insert individual responses into database
        const values = responses.map(response => `( ${response.questionId}, ${response.optionId}, ${responseId})`).join(',');
        pool.query(`INSERT INTO response_details ( question_id, option_id, response_id) VALUES ${values}`, (error) => {
            if (error) {
                console.error('Error inserting response details:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            res.status(200).json({ message: 'Response submitted successfully' });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
