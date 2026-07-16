import { Fragment } from "react";

export default function formatParagraph(texts: string[]) {
  return texts.flatMap((text, index) =>
    text ? (
      <Fragment key={index}>
        <p>{text}</p>
        {index < texts.length - 1 && <div className="h-4" />}
      </Fragment>
    ) : null,
  );
}
