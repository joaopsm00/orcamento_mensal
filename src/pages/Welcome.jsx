import { useNavigate } from "react-router-dom";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-icon">💰</div>
        <h1>Bem-vindo ao seu controle financeiro</h1>
        <p>
          Organize seu dinheiro de forma simples,
          acompanhe seus gastos e tenha mais controle
          da sua vida financeira.
        </p>

        <div className="features">
          <div>✅ Controle seus gastos</div>
          <div>📊 Entenda seu dinheiro</div>
          <div>🚀 Alcance seus objetivos</div>
        </div>

        <button onClick={() => navigate("/dashboard")}>Vamos salvar seu money! 🚀</button>
        <small>Sem sofrimento. Só organização.</small>
      </div>
    </div>
  );
}
