import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Newtonite Workflow Backend is listening on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
