import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axiosInstance from "../api/axiosInstance";

interface Notebook {
    id: number;
    name: string;
    code: string;
    language: string;
    stdout: string;
    stderr: string;
}

const monacoLanguageMap: Record<string, string> = {
    PYTHON: "python",
    JAVASCRIPT: "javascript",
    JAVA: "java",
    CPP: "cpp",
    C: "c",
    SQL: "sql",
};

const NotebookPage = () => {
    const { id } = useParams();

    const saveTimeout =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const [book, setBook] =
        useState<Notebook | null>(null);

    const [aiReview, setAiReview] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [aiLoading, setAiLoading] =
        useState(false);

    useEffect(() => {
        fetchBook();
    }, [id]);

    useEffect(() => {
        return () => {
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
        };
    }, []);

    const fetchBook = async () => {
        const res = await axiosInstance.get(
            `/codebook/${id}`
        );

        setBook(res.data);
    };

    const updateBook = async (
        updatedBook: Notebook
    ) => {
        await axiosInstance.put(
            `/codebook/${id}`,
            updatedBook
        );
    };

    const saveTitle = async (
        updatedTitle: string
    ) => {
        if (!book) return;

        const updatedBook = {
            ...book,
            name: updatedTitle,
        };

        setBook(updatedBook);

        await updateBook(updatedBook);
    };

    const saveLanguage = async (
        updatedLanguage: string
    ) => {
        if (!book) return;

        const updatedBook = {
            ...book,
            language: updatedLanguage,
            stdout: "",
            stderr: "",
        };

        setBook(updatedBook);

        await updateBook(updatedBook);
    };

    const handleCodeChange = (
        value: string | undefined
    ) => {
        if (!book) return;

        const updatedBook = {
            ...book,
            code: value || "",
        };

        setBook(updatedBook);

        if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
        }

        saveTimeout.current = setTimeout(
            async () => {
                await updateBook(updatedBook);
            },
            3000
        );
    };

    const handleRunCode = async () => {
        try {
            setLoading(true);
            setAiReview("");

            const res =
                await axiosInstance.post(
                    "/exec/executeCode",
                    {
                        codeBookId: id,
                    }
                );

            setBook((prev) =>
                prev
                    ? {
                        ...prev,
                        stdout:
                            res.data.stdout,
                        stderr:
                            res.data.stderr,
                    }
                    : null
            );

        } finally {
            setLoading(false);
        }
    };

    const handleAIDebug = async () => {
        try {
            setAiLoading(true);

            const res =
                await axiosInstance.post(
                    "/ai/debug",
                    {
                        codeBookId: id,
                    }
                );

            setAiReview(
                res.data.reviewedCode
            );

        } finally {
            setAiLoading(false);
        }
    };

    const handleCorrectCode =
        async () => {
            try {
                setAiLoading(true);

                const res =
                    await axiosInstance.post(
                        "/ai/correctCode",
                        {
                            codeBookId: id,
                        }
                    );

                if (!book) return;

                const updatedBook = {
                    ...book,
                    code: res.data.correctedCode,
                };

                setBook(updatedBook);

                await updateBook(
                    updatedBook
                );

            } finally {
                setAiLoading(false);
            }
        };

    if (!book) {
        return (
            <div className="text-white p-8">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex gap-4 items-center">

                    <input
                        value={book.name}
                        onChange={(e) =>
                            setBook({
                                ...book,
                                name:
                                    e.target
                                        .value,
                            })
                        }
                        onBlur={() =>
                            saveTitle(
                                book.name
                            )
                        }
                        onKeyDown={(e) => {
                            if (
                                e.key ===
                                "Enter"
                            ) {
                                saveTitle(
                                    book.name
                                );
                                e.currentTarget.blur();
                            }
                        }}
                        className="
                            text-2xl
                            font-bold
                            text-white
                            bg-transparent
                            outline-none
                            border-none
                            focus:border-b
                            focus:border-indigo-500
                        "
                    />

                    <select
                        value={
                            book.language
                        }
                        onChange={(e) =>
                            saveLanguage(
                                e.target
                                    .value
                            )
                        }
                        className="
                            bg-gray-800
                            text-white
                            px-4
                            py-2
                            rounded
                            border
                            border-gray-600
                        "
                    >
                        <option value="PYTHON">
                            Python
                        </option>
                        <option value="JAVASCRIPT">
                            JavaScript
                        </option>
                        <option value="JAVA">
                            Java
                        </option>
                        <option value="CPP">
                            C++
                        </option>
                        <option value="C">
                            C
                        </option>
                        <option value="SQL">
                            SQL
                        </option>
                    </select>

                </div>

                <div className="flex gap-4">

                    <button
                        onClick={
                            handleRunCode
                        }
                        disabled={loading}
                        className="bg-indigo-600 px-6 py-2 rounded text-white"
                    >
                        {loading
                            ? "Running..."
                            : "Run"}
                    </button>

                    <button
                        onClick={
                            handleAIDebug
                        }
                        disabled={
                            aiLoading
                        }
                        className="bg-purple-600 px-6 py-2 rounded text-white"
                    >
                        Debug
                    </button>

                    <button
                        onClick={
                            handleCorrectCode
                        }
                        disabled={
                            aiLoading
                        }
                        className="bg-green-600 px-6 py-2 rounded text-white"
                    >
                        Correct
                    </button>

                </div>

                <div className="grid grid-cols-12 gap-6 h-[650px]">

                    <div className="col-span-8 rounded-2xl overflow-hidden border border-indigo-500/20 bg-[#1e1e1e]">
                        <Editor
                            height="100%"
                            theme="hc-black"
                            language={
                                monacoLanguageMap[
                                book
                                    .language
                                ]
                            }
                            value={
                                book.code
                            }
                            onChange={
                                handleCodeChange
                            }
                            options={{
                                minimap:
                                {
                                    enabled: true,
                                },
                                fontSize: 15,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    <div className="col-span-4 bg-gray-900 rounded-lg flex flex-col overflow-hidden">

                        <div className="bg-gray-800 px-4 py-3">
                            <h2 className="text-green-400 font-bold">
                                {aiReview
                                    ? "AI Suggestions"
                                    : "Output"}
                            </h2>
                        </div>

                        <div className="flex-1 bg-black p-4 overflow-y-auto">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                {aiReview ||
                                    book.stderr ||
                                    book.stdout ||
                                    "Run code to see output"}
                            </pre>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default NotebookPage;