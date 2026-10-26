import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'

interface Props {
  i: number
  total: number
  onMover: (delta: number) => void
  onQuitar: () => void
}

export function BotonesFila({ i, total, onMover, onQuitar }: Props) {
  return (
    <div className="fila-botones">
      <button title="Subir" disabled={i === 0} onClick={() => onMover(-1)}>
        <ArrowUp size={13} />
      </button>
      <button title="Bajar" disabled={i === total - 1} onClick={() => onMover(1)}>
        <ArrowDown size={13} />
      </button>
      <button title="Quitar" className="quitar" onClick={onQuitar}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}
