
from flask import Flask, request, jsonify, send_from_directory
import sqlite3
from datetime import datetime

app = Flask(__name__)
DATABASE = "campuscare.db"


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def create_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            student_class TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def files(filename):
    return send_from_directory(".", filename)


@app.route("/api/complaints", methods=["GET"])
def get_complaints():
    conn = get_db()
    records = conn.execute(
        "SELECT * FROM complaints ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return jsonify([dict(record) for record in records])


@app.route("/api/complaints", methods=["POST"])
def add_complaint():
    data = request.get_json(silent=True) or {}

    student_name = str(data.get("student_name", "")).strip()
    student_class = str(data.get("student_class", "")).strip()
    category = str(data.get("category", "")).strip()
    description = str(data.get("description", "")).strip()

    if not all([student_name, student_class, category, description]):
        return jsonify({"error": "All fields are required"}), 400

    if len(student_name) > 100 or len(student_class) > 100:
        return jsonify({"error": "Name or class is too long"}), 400

    if len(description) > 2000:
        return jsonify({"error": "Description is too long"}), 400

    conn = get_db()
    cursor = conn.execute("""
        INSERT INTO complaints
        (student_name, student_class, category, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        student_name,
        student_class,
        category,
        description,
        "Pending",
        datetime.now().strftime("%Y-%m-%d %H:%M")
    ))

    complaint_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Complaint submitted successfully",
        "id": complaint_id
    }), 201


@app.route("/api/complaints/<int:complaint_id>", methods=["PATCH"])
sdef update_complaint(complaint_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")

    allowed_status = ["Pending", "In Progress", "Resolved"]

    if status not in allowed_status:
        return jsonify({"error": "Invalid status"}), 400

    conn = get_db()
    cursor = conn.execute(
        "UPDATE complaints SET status = ? WHERE id = ?",
        (status, complaint_id)
    )

    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({"error": "Complaint not found"}), 404

    return jsonify({"message": "Status updated successfully"})


if __name__ == "__main__":
    create_table()
    print("CampusCare Server Started!")
    print("Open http://127.0.0.1:5000")
    app.run(debug=True)
 