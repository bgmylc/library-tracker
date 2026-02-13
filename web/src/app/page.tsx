import Link from "next/link";

export default function HomePage() {
  return (
    <section className="panel homePanel">
      <div className="sectionHead">
        <h2>Start Here</h2>
        <p className="meta">Choose one focused flow.</p>
      </div>
      <div className="homeGrid">
        <Link className="homeCard" href="/add">
          <h3>Add Book</h3>
          <p>Fast entry with optional details and edit support.</p>
        </Link>
        <Link className="homeCard" href="/library">
          <h3>Library</h3>
          <p>Search, filter, review, and manage your collection.</p>
        </Link>
        <Link className="homeCard" href="/analytics">
          <h3>Analytics</h3>
          <p>Read progress, genre trends, and author insights.</p>
        </Link>
      </div>
    </section>
  );
}
