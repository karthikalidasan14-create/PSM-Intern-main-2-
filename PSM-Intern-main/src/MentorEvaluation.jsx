import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicAPI } from "./api.js";

const categories = [
  ["technical_skills", "Technical skills"],
  ["problem_solving", "Problem solving"],
  ["code_quality", "Code quality"],
  ["communication", "Communication"],
  ["teamwork", "Teamwork"],
];

export default function MentorEvaluation() {
  const { internId } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    PublicAPI.evaluation(internId)
      .then(setEvaluation)
      .catch((err) => setError(err.message));
  }, [internId]);

  if (error) return <main className="page"><div className="alert error">{error}</div></main>;
  if (!evaluation) return <main className="page"><p>Loading evaluation...</p></main>;

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">MENTOR EVALUATION</p>
        <h1>{evaluation.intern_name}</h1>
        <p className="muted">Published mentor assessment for intern {evaluation.intern_id}.</p>
        <div className="stats">
          {categories.map(([key, label]) => (
            <article className="stat" key={key}>
              <p>{label}</p>
              <h2>{evaluation[key]}/20</h2>
            </article>
          ))}
        </div>
        <p><strong>Total marks:</strong> {evaluation.total_marks}/100</p>
        <p><strong>Percentage:</strong> {evaluation.percentage}%</p>
        <p><strong>Grade:</strong> {evaluation.grade}</p>
        <p><strong>Mentor:</strong> {evaluation.mentor?.name || "Assigned mentor"}</p>
        <p><strong>Feedback:</strong> {evaluation.feedback}</p>
        <Link className="button secondary" to={`/intern/${internId}`}>Back to profile</Link>
      </section>
    </main>
  );
}
