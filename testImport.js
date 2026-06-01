fetch('http://localhost:5000/api/contacts/import', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
