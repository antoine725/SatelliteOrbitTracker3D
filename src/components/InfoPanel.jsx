export default function InfoPanel({ data, isTracked, onTrack, onUntrack }) {
  return (
    <div className={`info-panel ${data ? 'visible' : ''}`}>
      {data && (
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em' }}>{data.name}</h3>
          
          <p style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '15px' }}>
            Identifiant NORAD : {data.id}
          </p>

          {isTracked ? (
            <button 
              onClick={onUntrack}
              style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Arrêter le suivi
            </button>
          ) : (
            <button 
              onClick={onTrack}
              style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Suivre la caméra
            </button>
          )}
        </div>
      )}
    </div>
  );
}