// Function for finding if a user is in the database by email
function getUserByEmail(emailInput, database) {
  let foundUser = null;
  for (const userId in database) {
    const user = database[userId];
    if (user.email === emailInput) {
      foundUser = user;
      return foundUser;
    }
  }

  return foundUser;
}


module.exports = { getUserByEmail };