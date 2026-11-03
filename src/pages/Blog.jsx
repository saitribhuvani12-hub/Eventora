import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { departmentLabel } from "../data/events";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO = 25 * 1024 * 1024; // 25 MB

// Quick check in the browser. The server repeats it by reading the real file.
function checkFile(file) {
  if (!file) return "";
  if (IMAGE_TYPES.includes(file.type)) {
    return file.size > MAX_IMAGE ? "Photos must be 5 MB or smaller." : "";
  }
  if (VIDEO_TYPES.includes(file.type)) {
    return file.size > MAX_VIDEO ? "Videos must be 25 MB or smaller." : "";
  }
  return "Only JPG, PNG, WEBP or GIF photos and MP4 or WEBM videos are allowed.";
}

function niceDate(isoText) {
  return new Date(isoText).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// One post in the feed
function PostCard({ post, onDelete }) {
  return (
    <article className="card post-card">
      <div className="post-head">
        <div className="avatar">{post.authorName.charAt(0).toUpperCase()}</div>
        <div className="post-author">
          <strong>{post.authorName}</strong>
          <div className="muted small">
            <span className={"dept-badge dept-" + post.authorDepartment}>
              {departmentLabel(post.authorDepartment)}
            </span>{" "}
            · {niceDate(post.createdAt)}
          </div>
        </div>
        {post.canDelete && (
          <button className="btn btn-danger btn-small" onClick={() => onDelete(post)}>
            Delete
          </button>
        )}
      </div>

      {post.eventTitle && <div className="post-event">🎟️ {post.eventTitle}</div>}

      <h3 className="post-caption">{post.caption}</h3>
      {post.description && <p className="post-text">{post.description}</p>}

      {post.mediaType === "image" && (
        <img src={post.mediaUrl} alt={post.caption} className="post-media" loading="lazy" />
      )}
      {post.mediaType === "video" && (
        <video src={post.mediaUrl} className="post-media" controls preload="metadata" />
      )}
    </article>
  );
}

function Blog({ user, events }) {
  const isStudent = user.role === "Student";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({ caption: "", description: "", eventId: "" });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileInput = useRef(null);

  // Events a student can write about (approved ones, newest first)
  const taggable = events
    .filter((e) => e.status === "Approved")
    .sort((a, b) => b.date.localeCompare(a.date));

  // Load the feed
  useEffect(() => {
    api("GET", "/posts").then((res) => {
      if (res.ok) setPosts(res.data.posts);
      else setLoadError(res.data.message || "Could not load posts.");
      setLoading(false);
    });
  }, []);

  // Show a small preview of the chosen photo or video
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setMessage(null);
  }

  function handleFile(e) {
    const chosen = e.target.files[0] || null;
    setFile(chosen);
    setErrors({ ...errors, media: checkFile(chosen) });
    setMessage(null);
  }

  function removeFile() {
    setFile(null);
    setErrors({ ...errors, media: "" });
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const found = {};
    const caption = form.caption.trim();
    if (!caption) found.caption = "Please write a caption.";
    else if (caption.length > 150) found.caption = "Caption can be at most 150 characters.";
    if (form.description.trim().length > 1000) {
      found.description = "Description can be at most 1000 characters.";
    }
    const fileProblem = checkFile(file);
    if (fileProblem) found.media = fileProblem;

    if (Object.keys(found).length > 0) {
      setErrors(found);
      setMessage({ ok: false, text: "Please correct the highlighted fields." });
      return;
    }

    // FormData is how a browser sends text together with a file
    const data = new FormData();
    data.append("caption", caption);
    if (form.description.trim()) data.append("description", form.description.trim());
    if (form.eventId) data.append("eventId", form.eventId);
    if (file) data.append("media", file);

    setPosting(true);
    const res = await api("POST", "/posts", data);
    setPosting(false);

    if (res.ok) {
      setPosts([res.data.post, ...posts]); // show the new post at the top
      setForm({ caption: "", description: "", eventId: "" });
      removeFile();
      setErrors({});
      setMessage({ ok: true, text: res.data.message });
    } else {
      setErrors(res.data.errors || {});
      setMessage({ ok: false, text: res.data.message || "Could not share your post." });
    }
  }

  async function handleDelete(post) {
    if (!window.confirm("Delete this post?")) return;
    const res = await api("DELETE", "/posts/" + post.id);
    if (res.ok) setPosts(posts.filter((p) => p.id !== post.id));
    else setMessage({ ok: false, text: res.data.message || "Could not delete the post." });
  }

  return (
    <div className="container blog">
      <h1>Eventora Community Blog</h1>
      <p className="muted">
        Share your experiences, feedback and photos from campus events.
      </p>

      {isStudent ? (
        <div className="card">
          <h2>Share your experience</h2>

          {message && (
            <div className={message.ok ? "alert alert-ok" : "alert alert-error"}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form form-blog" noValidate>
            <label htmlFor="caption">
              Caption <span className="required-star">*</span>
            </label>
            <input
              id="caption"
              name="caption"
              value={form.caption}
              onChange={handleChange}
              className={errors.caption ? "invalid" : ""}
              placeholder="e.g. What a day at the hackathon!"
              maxLength={200}
            />
            <div className="char-count">{form.caption.trim().length} / 150</div>
            {errors.caption && <div className="field-error">{errors.caption}</div>}

            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              className={errors.description ? "invalid" : ""}
              placeholder="Tell us more about your experience or feedback..."
            />
            {errors.description && <div className="field-error">{errors.description}</div>}

            <label htmlFor="eventId">About which event? (optional)</label>
            <select id="eventId" name="eventId" value={form.eventId} onChange={handleChange}>
              <option value="">Not about a specific event</option>
              {taggable.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            {errors.eventId && <div className="field-error">{errors.eventId}</div>}

            <label htmlFor="media">Photo or video (optional)</label>
            <input
              id="media"
              type="file"
              ref={fileInput}
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={handleFile}
            />
            <div className="muted small">
              Photos: JPG, PNG, WEBP or GIF up to 5 MB. Videos: MP4 or WEBM up to 25 MB.
            </div>
            {errors.media && <div className="field-error">{errors.media}</div>}

            {file && !errors.media && previewUrl && (
              <div className="preview">
                {file.type.startsWith("video/") ? (
                  <video src={previewUrl} controls className="post-media" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="post-media" />
                )}
                <button type="button" className="btn btn-small" onClick={removeFile}>
                  Remove file
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={posting}>
              {posting ? "Sharing..." : "Share post"}
            </button>
          </form>
        </div>
      ) : (
        <div className="alert alert-info">
          Students share posts here. As {user.role}, you can read every post
          {user.role === "Admin" ? " and delete any post." : "."}
        </div>
      )}

      <div className="section-head">
        <h2>Community posts ({posts.length})</h2>
      </div>

      {loading && <p className="muted">Loading posts...</p>}
      {loadError && <div className="alert alert-error">{loadError}</div>}
      {!loading && !loadError && posts.length === 0 && (
        <div className="card">No posts yet. Be the first to share your experience!</div>
      )}

      <div className="feed">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

export default Blog;