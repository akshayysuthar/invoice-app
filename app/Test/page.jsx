"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitHubLogoIcon, PlusIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useToast } from "@/hooks/use-toast";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [githubIssues, setGithubIssues] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [teamMembers] = useState(["Alice", "Bob", "Charlie", "David"]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const githubToken = "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";
  const repoOwner = "akshayysuthar";
  const repoName = "best-chatting-app";

  useEffect(() => {
    fetchGithubIssues();
  }, []);

  const fetchGithubIssues = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
        {
          headers: {
            Authorization: `token ${githubToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API responded with status ${response.status}`);
      }

      const issues = await response.json();

      if (!Array.isArray(issues)) {
        throw new Error("GitHub API did not return an array of issues");
      }

      setGithubIssues(issues);

      // Automatically create tasks from new GitHub issues
      const newTasks = issues
        .filter(
          (issue) => !tasks.some((task) => task.id === `github-${issue.id}`)
        )
        .map((issue) => ({
          id: `github-${issue.id}`,
          title: issue.title,
          completed: false,
          assignee: "",
          source: "github",
          createdAt: new Date().toISOString(),
        }));

      setTasks((prevTasks) => [...prevTasks, ...newTasks]);
      toast({
        title: "GitHub Issues Synced",
        description: `${newTasks.length} new tasks added from GitHub issues.`,
      });
    } catch (error) {
      console.error("Error fetching GitHub issues:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: `Failed to fetch GitHub issues: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = () => {
    if (newTask.trim() !== "") {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          title: newTask,
          completed: false,
          assignee: selectedMember,
          source: "manual",
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewTask("");
      setSelectedMember("");
      toast({
        title: "Task Added",
        description: "New task has been added successfully.",
      });
    }
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const assignTask = (id, assignee) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, assignee } : task))
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast({
      title: "Task Deleted",
      description: "The task has been removed.",
    });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "open") return !task.completed;
    if (filter === "closed") return task.completed;
    return true;
  });

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6 bg-gray-800 text-gray-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Task Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task"
              className="flex-grow bg-gray-700 text-white border-none focus:ring-2 focus:ring-indigo-500"
            />
            <Select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-40 bg-gray-700 text-white"
            >
              <option value="">Assign to</option>
              {teamMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </Select>
            <Button
              onClick={addTask}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-40 bg-gray-700 text-white"
            >
              <option value="all">All Tasks</option>
              <option value="open">Open Tasks</option>
              <option value="closed">Closed Tasks</option>
            </Select>
            <Button
              onClick={fetchGithubIssues}
              variant="outline"
              disabled={isLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
            >
              <GitHubLogoIcon className="mr-2 h-4 w-4" />
              {isLoading ? "Syncing..." : "Sync GitHub Issues"}
            </Button>
          </div>
          {error && (
            <div
              className="bg-red-200 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <ul className="space-y-2">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between p-2 bg-gray-700 rounded"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="text-white"
                  />
                  <span
                    className={
                      task.completed
                        ? "line-through text-gray-400"
                        : "text-white"
                    }
                  >
                    {task.title}
                  </span>
                  {task.source === "github" && (
                    <GitHubLogoIcon className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={task.assignee}
                    onChange={(e) => assignTask(task.id, e.target.value)}
                    className="w-32 bg-gray-700 text-white"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </Select>
                  <Button
                    onClick={() => deleteTask(task.id)}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-gray-600"
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
