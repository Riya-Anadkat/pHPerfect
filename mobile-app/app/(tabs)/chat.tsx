// app/(tabs)/forum.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../utils/firebaseConfig";

// Mock data for forum posts (replace with actual data from your backend)
interface ForumPost {
  id: string;
  author: string;
  authorId: string;
  title: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: ForumComment[];
}

interface ForumComment {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
}

// Mock data for initial posts
const INITIAL_POSTS: ForumPost[] = [
  {
    id: "1",
    author: "HairCareEnthusiast",
    authorId: "user1",
    title: "Dealing with dry scalp in winter",
    content:
      "I've been struggling with dry scalp this winter. My pH levels are around 6.8. Any tips or product recommendations?",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    likes: 7,
    comments: [
      {
        id: "c1",
        author: "ScalpExpert",
        authorId: "user2",
        content:
          "Try using a moisturizing shampoo with aloe vera. It worked great for my dry scalp!",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "c2",
        author: "pHProUser",
        authorId: "user3",
        content:
          "I had the same issue! Using products with a slightly acidic pH (around 5.5) really helped balance my scalp.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: "2",
    author: "CurlyHairLover",
    authorId: "user4",
    title: "pH perfect helped me understand my scalp health!",
    content:
      "Since I started monitoring my scalp pH with pHPerfect, I've been able to adjust my hair care routine and finally tackle my dandruff issues. My levels went from 7.2 to a healthier 5.8!",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    likes: 12,
    comments: [],
  },
  {
    id: "3",
    author: "HairScientist",
    authorId: "user5",
    title: "The science behind pH and hair health",
    content:
      "Just wanted to share some insights about why pH matters for scalp health. The acid mantle of your scalp has a natural pH between 4.5-5.5. When this gets disrupted, it can lead to various issues like dandruff, irritation, and even hair loss. Keeping track of your scalp's pH is crucial!",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    likes: 23,
    comments: [
      {
        id: "c3",
        author: "NewUser",
        authorId: "user6",
        content:
          "This is so interesting! I had no idea pH was so important for hair health.",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
    ],
  },
];

export default function ForumScreen() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostModal, setNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load posts when component mounts
  useEffect(() => {
    // Simulate fetching posts from backend
    setTimeout(() => {
      setPosts(INITIAL_POSTS);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle creating a new post
  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert(
        "Error",
        "Please enter both a title and content for your post."
      );
      return;
    }

    setSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      const newPost: ForumPost = {
        id: Date.now().toString(),
        author: auth.currentUser?.email?.split("@")[0] || "Anonymous",
        authorId: auth.currentUser?.uid || "unknown",
        title: newPostTitle,
        content: newPostContent,
        timestamp: new Date(),
        likes: 0,
        comments: [],
      };

      setPosts([newPost, ...posts]);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostModal(false);
      setSubmitting(false);
    }, 1000);
  };

  // Handle adding a comment to a post
  const handleAddComment = () => {
    if (!commentText.trim() || !selectedPost) return;

    setSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      const newComment: ForumComment = {
        id: Date.now().toString(),
        author: auth.currentUser?.email?.split("@")[0] || "Anonymous",
        authorId: auth.currentUser?.uid || "unknown",
        content: commentText,
        timestamp: new Date(),
      };

      const updatedPosts = posts.map((post) => {
        if (post.id === selectedPost.id) {
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      });

      setPosts(updatedPosts);
      setCommentText("");

      // Update selected post with new comment
      const updatedPost = updatedPosts.find((p) => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }

      setSubmitting(false);
    }, 800);
  };

  // Handle liking a post
  const handleLikePost = (postId: string) => {
    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.likes + 1,
        };
      }
      return post;
    });

    setPosts(updatedPosts);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render post item
  const renderPostItem = ({ item }: { item: ForumPost }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => setSelectedPost(item)}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postAuthor}>by {item.author}</Text>
      </View>

      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.postFooter}>
        <Text style={styles.postDate}>{formatDate(item.timestamp)}</Text>

        <View style={styles.postStats}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLikePost(item.id)}
          >
            <Ionicons name="heart-outline" size={18} color="#EC9595" />
            <Text style={styles.likeCount}>{item.likes}</Text>
          </TouchableOpacity>

          <View style={styles.commentCount}>
            <Ionicons name="chatbubble-outline" size={18} color="#666" />
            <Text style={styles.commentCountText}>{item.comments.length}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC9595" />
        <Text style={styles.loadingText}>Loading community forum...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>pHPerfect Community</Text>
            <Text style={styles.headerSubtitle}>
              Connect and share with other hair health enthusiasts
            </Text>
          </View>
        }
      />

      {/* Floating Action Button for new post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setNewPostModal(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* New Post Modal */}
      <Modal
        visible={newPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Post</Text>
              <TouchableOpacity onPress={() => setNewPostModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Post Title"
              value={newPostTitle}
              onChangeText={setNewPostTitle}
              maxLength={100}
            />

            <TextInput
              style={styles.contentInput}
              placeholder="Share your thoughts, questions, or experiences..."
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreatePost}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        visible={!!selectedPost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Details</Text>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <>
                <ScrollView style={styles.postDetailContainer}>
                  <View style={styles.postDetailHeader}>
                    <Text style={styles.postDetailTitle}>
                      {selectedPost.title}
                    </Text>
                    <Text style={styles.postDetailAuthor}>
                      Posted by {selectedPost.author} •{" "}
                      {formatDate(selectedPost.timestamp)}
                    </Text>
                  </View>

                  <Text style={styles.postDetailContent}>
                    {selectedPost.content}
                  </Text>

                  <View style={styles.postDetailStats}>
                    <TouchableOpacity
                      style={styles.likeButtonDetail}
                      onPress={() => {
                        handleLikePost(selectedPost.id);
                        // Update the selected post to reflect the like
                        setSelectedPost({
                          ...selectedPost,
                          likes: selectedPost.likes + 1,
                        });
                      }}
                    >
                      <Ionicons
                        name="heart-outline"
                        size={18}
                        color="#EC9595"
                      />
                      <Text style={styles.likeCountDetail}>
                        {selectedPost.likes} likes
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.commentCountDetail}>
                      {selectedPost.comments.length} comments
                    </Text>
                  </View>

                  <View style={styles.commentSection}>
                    <Text style={styles.commentSectionTitle}>Comments</Text>

                    {selectedPost.comments.length === 0 ? (
                      <Text style={styles.noCommentsText}>
                        No comments yet. Be the first to comment!
                      </Text>
                    ) : (
                      selectedPost.comments.map((comment) => (
                        <View key={comment.id} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentAuthor}>
                              {comment.author}
                            </Text>
                            <Text style={styles.commentDate}>
                              {formatDate(comment.timestamp)}
                            </Text>
                          </View>
                          <Text style={styles.commentContent}>
                            {comment.content}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>

                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.commentSubmitButton,
                      (!commentText.trim() || submitting) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleAddComment}
                    disabled={!commentText.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E7E7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7E7E7",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#333",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 14,
    color: "#666",
  },
  postContent: {
    fontSize: 16,
    color: "#444",
    marginBottom: 12,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  postDate: {
    fontSize: 14,
    color: "#888",
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  commentCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentCountText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EC9595",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  contentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 150,
    backgroundColor: "#f9f9f9",
  },
  submitButton: {
    backgroundColor: "#EC9595",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  postDetailContainer: {
    maxHeight: "80%",
  },
  postDetailHeader: {
    marginBottom: 16,
  },
  postDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  postDetailAuthor: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  postDetailContent: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    marginBottom: 16,
  },
  postDetailStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  likeButtonDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  likeCountDetail: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  commentCountDetail: {
    fontSize: 14,
    color: "#666",
  },
  commentSection: {
    marginBottom: 16,
  },
  commentSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  noCommentsText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#888",
  },
  commentContent: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
    backgroundColor: "#f9f9f9",
    maxHeight: 100,
  },
  commentSubmitButton: {
    backgroundColor: "#EC9595",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  disabledButton: {
    backgroundColor: "#ddd",
  },
});
