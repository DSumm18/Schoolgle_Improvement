export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>✅ Server is Working!</h1>
      <p>If you can see this, Next.js routing is working.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}

