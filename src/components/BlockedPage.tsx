const BlockedPage = () => (
  <div
    style={{
      fontFamily: "Times, serif",
      padding: "1em",
      color: "#000",
      background: "#fff",
      minHeight: "100vh",
    }}
  >
    <h1 style={{ fontSize: "2em", margin: "0 0 0.5em" }}>Not Found</h1>
    <p>The requested URL was not found on this server.</p>
    <hr />
    <address style={{ fontStyle: "italic" }}>
      Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/8.0.3 Server at 127.0.0.1 Port 80
    </address>
  </div>
);

export default BlockedPage;
