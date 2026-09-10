import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { Icon } from "./icons";
import { makeId } from "./game-store";
import { saveObservation, type StoredObservation } from "./storage";

export function Panel({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const cancel = (event: Event) => {
      event.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener("cancel", cancel);
    return () => {
      dialog.removeEventListener("cancel", cancel);
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`field-panel ${wide ? "wide" : ""}`}
      aria-labelledby="panel-title"
    >
      <header className="panel-heading">
        <h2 id="panel-title">{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Закрыть">
          <Icon name="close" />
        </button>
      </header>
      <div className="panel-body">{children}</div>
    </dialog>
  );
}

export function BlobPhoto({ blob, name }: { blob: Blob; name: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return <img className="observation-photo" src={src} alt={name} />;
}

export function Capture({
  saved,
}: {
  saved: (record: StoredObservation) => void;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA"),
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const record: StoredObservation = {
      id: makeId(),
      title: title.trim() || "Неизвестный организм",
      note,
      locationLabel: place.trim() || "Место не указано",
      observedAt: date,
      createdAt: new Date().toISOString(),
      status: "local_only",
      photos: files.map((file) => ({
        name: file.name,
        type: file.type,
        blob: file,
      })),
    };
    try {
      await saveObservation(record);
      saved(record);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось сохранить. Черновик оставлен здесь.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="capture-form" onSubmit={submit}>
      <p>
        Своя находка. Можно не знать вид и место. Звук здесь выключен,
        координаты не запрашиваются.
      </p>
      <label className="file-picker">
        <Icon name="camera" /> Добавить фото
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            if (
              selected.some(
                (file) =>
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    file.type,
                  ) || file.size > 20 * 1024 * 1024,
              ) ||
              selected.length > 5
            ) {
              setError("Можно до 5 фото JPEG, PNG или WebP, каждое до 20 МБ.");
              return;
            }
            setError("");
            setFiles(selected);
          }}
        />
      </label>
      {files.length > 0 && (
        <div className="capture-previews">
          {files.map((file) => (
            <BlobPhoto
              key={`${file.name}-${file.lastModified}`}
              blob={file}
              name={file.name}
            />
          ))}
        </div>
      )}
      <label>
        Как назовём находку?
        <input
          value={title}
          maxLength={140}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Неизвестный организм"
        />
      </label>
      <label>
        Что заметили?
        <textarea
          value={note}
          maxLength={4000}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Цвет, форма, влажная кора…"
          rows={3}
        />
      </label>
      <label>
        Место — необязательно
        <input
          value={place}
          maxLength={200}
          onChange={(event) => setPlace(event.target.value)}
          placeholder="Например, лесная тропа"
        />
      </label>
      <label>
        Дата наблюдения
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </label>
      <p className="fineprint">
        Оригиналы сохранятся только в этом браузере. Облачной синхронизации пока
        нет. Очистка данных браузера удалит локальные записи.
      </p>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <button className="primary" disabled={saving} type="submit">
        <Icon name="book" />
        {saving ? "Сохраняем…" : "Сохранить на устройстве"}
      </button>
    </form>
  );
}
