const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OThiM2UxMTRlMjZjYjkyMTYyOTRjNWEiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3MTg2MDc3OSwiZXhwIjoxNzcxODYxNjc5fQ.XkitLhoPdmnZAYjahum5LtXn-_DtAJPbJJtk3LFwFbk";

const URL = "http://localhost:5000/api/user/profile";

async function flood() {
  console.log("Starting flood attack simulation...");

  for (let i = 0; i < 80; i++) {
    fetch(URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(() => console.log("Request sent:", i))
      .catch((err) => console.log("Error:", err.message));
  }
}

flood();