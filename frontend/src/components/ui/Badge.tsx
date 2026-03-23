const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping:  "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  paid:      "bg-green-100 text-green-800",
  failed:    "bg-red-100 text-red-800",
  cod:       "bg-orange-100 text-orange-800",
  online:    "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping:  "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  paid:      "Đã thanh toán",
  failed:    "Thất bại",
  cod:       "COD",
  online:    "Online",
};

interface Props { value: string; className?: string }

export default function Badge({ value, className = "" }: Props) {
  return (
    <span className={`badge ${STATUS_STYLES[value] ?? "bg-gray-100 text-gray-700"} ${className}`}>
      {STATUS_LABELS[value] ?? value}
    </span>
  );
}
