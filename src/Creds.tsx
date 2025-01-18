import { FaGithub, FaTwitter } from "react-icons/fa";

export function Creds() {
  return (
    <>
      <div className="ui-container">
        <div>
          <h1>WEB</h1>
          <h1>GPU</h1>
        </div>
      </div>
      <div className="copy">
        <span>
          <a target="_blank" href="https://twitter.com/CantBeFaraz">
            <FaTwitter size={40} />
          </a>
        </span>

        <span>
          r3f Water Shader <br /> Made by{" "}
          <a target="_blank" href="https://twitter.com/CantBeFaraz">
            Faraz Shaikh
          </a>
          <br /> Based on{" "}
          <a
            target="_blank"
            href="https://ameye.dev/notes/stylized-water-shader/"
          >
            Alexander Ameye
          </a>
        </span>

        <span>
          <a target="_blank" href="https://github.com/FarazzShaikh">
            <FaGithub size={40} />
          </a>
        </span>
      </div>
    </>
  );
}
