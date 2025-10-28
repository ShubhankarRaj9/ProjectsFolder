exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

exports.facultyOnly = (req, res, next) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Faculty access required' });
  }
  next();
};

exports.studentOnly = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};

exports.adminOrFacultyOnly = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'faculty') {
    return next();
  }
  return res.status(403).json({ message: 'Admin or faculty access required' });
};
