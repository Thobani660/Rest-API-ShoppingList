const http = require('http');
const fs = require('fs');
const url = require('url');

const DATA_FILE = './shopping-list.json';

// Helper function to read JSON data from the file
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
         
            return [];
        }
        console.error('Error reading data:', error);
        throw new Error('Could not read data from file');
    }
};

// Helper function to write JSON data to the file
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));  
    } catch (error) {
        console.error('Error writing data:', error);
        throw new Error('Could not write data to file');
    }
};

// Create the HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);  
    const method = req.method;  
    const headers = { 'Content-Type': 'application/json' };

    // Handle requests to '/shopping-list'
    if (parsedUrl.pathname === '/shopping-list') {

        // Handle GET request (Retrieve the current shopping list)
        if (method === 'GET') {
            try {
                const shoppingList = readData();
                res.writeHead(200, headers);
                res.end(JSON.stringify(shoppingList))
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error: could not retrieve shopping list');
            }

        // Handle POST request (Add a new item to the shopping list)
        } else if (method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();  
            });
            req.on('end', () => {
                try {
                    const newItem = JSON.parse(body);  // Parse request body as JSON
                    // Validate the new item (name should be non-empty, quantity should be > 0)
                    if (!newItem.name || newItem.quantity <= 0) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        return res.end('Invalid item. Name must be non-empty and quantity must be greater than 0.');
                    }
                    const shoppingList = readData(); 
                    shoppingList.push(newItem);  
                    writeData(shoppingList); 
                    res.writeHead(201, headers);
                    res.end(JSON.stringify(newItem));  
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Invalid JSON format');  
                }
            });

        // Handle PUT or PATCH request (Update an existing shopping list item)
        } else if (method === 'PUT' || method === 'PATCH') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); 
            });
            req.on('end', () => {
                try {
                    const updatedItem = JSON.parse(body); 
                    // Validate the updated item (name should be non-empty, quantity should be > 0)
                    if (!updatedItem.name || updatedItem.quantity <= 0) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        return res.end('Invalid item. Name must be non-empty and quantity must be greater than 0.');
                    }
                    const shoppingList = readData();  
                    const index = shoppingList.findIndex(item => item.name === updatedItem.name);  // Find the item by name
                    if (index === -1) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        return res.end('Item not found');
                    }
                    shoppingList[index].quantity = updatedItem.quantity; 
                    writeData(shoppingList);  
                    res.writeHead(200, headers);
                    res.end(JSON.stringify(shoppingList[index]));  
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Invalid JSON format');
                }
            });

        // Handle DELETE request (Remove an item from the shopping list)
        } else if (method === 'DELETE') {
            const itemName = parsedUrl.query.name; 
            if (!itemName) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end('Item name is required');  
            }
            try {
                const shoppingList = readData(); 
                const updatedList = shoppingList.filter(item => item.name !== itemName); 
                if (updatedList.length === shoppingList.length) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    return res.end('Item not found');  
                }
                writeData(updatedList);  
                res.writeHead(204); 
                res.end();
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error: could not delete item'); 
            }

        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');  
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');  
    }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
