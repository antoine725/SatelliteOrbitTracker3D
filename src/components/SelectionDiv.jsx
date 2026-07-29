export default function SelectionDiv({ classParam, id, satName, isChecked, onChange, onNameClick }) {
  return (
    <div className={classParam}>
      <input 
        type="checkbox" 
        id={id} 
        checked={isChecked} 
        onChange={onChange} 
        style={{ cursor: 'pointer' }}
      />
      <label 
        htmlFor={id}
        onClick={(e) => {
          if (onNameClick) {
            e.preventDefault(); 
            onNameClick();
          }
        }}
        style={{ cursor: 'pointer', flex: 1, userSelect: 'none' }}
      >
        {satName}
      </label>
    </div>
  );
}