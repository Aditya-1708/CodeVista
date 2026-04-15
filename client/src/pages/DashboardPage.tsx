import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const [notebooks, setNotebooks] = useState([]);
  const navigate = useNavigate();

  const fetchBooks = async () => {
    const res = await axiosInstance.get("/codebook");

    setNotebooks(res.data);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreate = async () => {
    const res = await axiosInstance.post("/codebook");

    navigate(`/notebook/${res.data.id}`);
  };

  const handleDelete = async (id: number) => {
    await axiosInstance.delete(`/codebook/${id}`);

    fetchBooks();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            My Notebooks
          </h1>

          <button
            onClick={handleCreate}
            className="bg-indigo-600 px-4 py-2 rounded text-white"
          >
            + New Notebook
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {notebooks.map((book: any) => (
            <div
              key={book.id}
              className="bg-gray-900 p-6 rounded-xl border border-gray-800 cursor-pointer hover:border-indigo-500"
            >
              <h2
                onClick={() =>
                  navigate(`/notebook/${book.id}`)
                }
                className="text-xl text-white font-semibold"
              >
                {book.name}
              </h2>

              <p className="text-gray-400 mt-2">
                {book.language}
              </p>

              <button
                onClick={() =>
                  handleDelete(book.id)
                }
                className="mt-4 text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;