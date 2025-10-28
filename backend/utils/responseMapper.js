const mapUserResponse = (user) => ({
  id: user._id?.toString(),   // expose as "id" instead of "_id"
  name: user.name|| user.instituteEmailId.split("@")[0],
  email: user.instituteEmailId || user.email, // use consistent field
  role: user.role,
});

module.exports = {
  mapUserResponse,
};
