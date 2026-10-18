import { ORDER_STATUS_LABEL } from '../../constants';
import type { Order } from '../../types';
import { formatDate, formatMoney } from '../../utils';

interface Props {
  order: Order;
  /** Product names by id, for orders that were never priced. */
  names: Record<string, string>;
  showOwner: boolean;
  onCancel: () => void;
}

export function OrderRow({ order, names, showOwner, onCancel }: Props) {
  const cancellable = order.status === 'pending' || order.status === 'confirmed';
  return (
    <article className="panel order">
      <div className="order__head">
        <span className={`status status--${order.status}`}>{ORDER_STATUS_LABEL[order.status]}</span>
        <span className="muted">{formatDate(order.createdAt)}</span>
        {showOwner && <code className="muted">{order.userId.slice(0, 8)}</code>}
        <strong>{order.total !== undefined && order.total !== null ? formatMoney(order.total) : '—'}</strong>
      </div>
      <ul className="order__lines">
        {(order.lines ?? order.items.map((i) => ({ ...i, name: names[i.productId] ?? 'a removed product', price: 0 }))).map((l) => (
          <li key={l.productId}>
            {l.quantity} × {l.name}
          </li>
        ))}
      </ul>
      {order.reason && <p className="muted">{order.reason}</p>}
      {cancellable && (
        <button className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      )}
    </article>
  );
}
