import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";

export default function SearchCommunity() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Chrisitan posts", posts);

        setPosts(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <Box>
      <Text>Search For Community</Text>
    </Box>
  );
}
