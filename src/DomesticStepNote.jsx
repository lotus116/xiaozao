import React from "react";

export default function DomesticStepNote({ recipe, index }) {
  const review = recipe.domesticSources?.[0];
  if (!review || review.step !== index) return null;
  return (
    <details className="domestic-step-note">
      <summary>这一步的做法对照</summary>
      <p><strong>原作者的做法　</strong>{review.supports}</p>
      <p><strong>小灶做法　</strong>{review.adaptation}</p>
      <a href={review.url} target="_blank" rel="noreferrer">{review.site} · {review.title}</a>
    </details>
  );
}
