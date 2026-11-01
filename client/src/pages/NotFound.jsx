import { Btn, Arrow } from '../components/Ui.jsx';

export default function NotFound() {
  return (
    <div className="page">
      <header className="pagehead">
        <h1 className="h1">This page is <em>not built</em> yet.</h1>
        <p className="lead">The address may have changed. Our projects are a good place to start.</p>
        <Btn to="/projects">See all projects <Arrow /></Btn>
      </header>
    </div>
  );
}
