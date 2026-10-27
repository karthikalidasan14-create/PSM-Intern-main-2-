import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { PublicAPI } from "./api.js";

export default function ProjectOverview() {
  const { internId } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    PublicAPI.project(internId)
      .then(setProject)
      .catch((err) => setError(err.message));
  }, [internId]);

  if (error) return <main className="page"><div className="alert error">{error}</div></main>;
  if (!project) return <main className="page"><p>Loading project...</p></main>;

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">PROJECT OVERVIEW</p>
        <h1>{project.title}</h1>
        <p><StatusBadge status={project.status} /></p>
        <p>{project.description}</p>
        <p><strong>Technologies:</strong> {project.technologies || "Not listed"}</p>
        <div className="row-actions">
          {project.github_url && (
            <a className="button" href={project.github_url} target="_blank" rel="noreferrer">
              Open GitHub repository
            </a>
          )}
          {project.live_url && (
            <a className="button secondary" href={project.live_url} target="_blank" rel="noreferrer">
              Open live project
            </a>
          )}
          <Link className="button secondary" to={`/intern/${internId}`}>Back to profile</Link>
        </div>
      </section>
    </main>
  );
}
