import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getPageContent } from "~utils/contentExtractor";
import { getMessage } from "~utils/i18n";

interface PageContextWelcomeProps {
  currentTheme: "light" | "dark";
  fontSizes: any;
  themedStyles: any;
  onQuestionClick: (question: string) => void;
  isVisible: boolean;
}

interface PageContext {
  title: string;
  url: string;
  contentType: 'article' | 'tutorial' | 'news' | 'product' | 'documentation' | 'social' | 'search' | 'general';
  summary: string;
  keyTopics: string[];
  suggestedQuestions: string[];
}

const PageContextWelcome: React.FC<PageContextWelcomeProps> = ({
  currentTheme,
  fontSizes,
  themedStyles,
  onQuestionClick,
  isVisible
}) => {
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePageContent = async (): Promise<PageContext> => {
    const content = getPageContent('free');
    const title = document.title;
    const url = window.location.href;
    const hostname = window.location.hostname;

    // Detect content type based on URL patterns and content
    let contentType: PageContext['contentType'] = 'general';
    
    // URL-based detection
    if (hostname.includes('youtube.com') || hostname.includes('vimeo.com')) {
      contentType = 'social';
    } else if (hostname.includes('github.com') || hostname.includes('stackoverflow.com')) {
      contentType = 'documentation';
    } else if (hostname.includes('amazon.com') || hostname.includes('ebay.com') || url.includes('shop')) {
      contentType = 'product';
    } else if (content.includes('tutorial') || content.includes('how to') || content.includes('step')) {
      contentType = 'tutorial';
    } else if (content.includes('news') || content.includes('breaking') || hostname.includes('news')) {
      contentType = 'news';
    } else if (content.includes('article') || content.length > 2000) {
      contentType = 'article';
    }

    // Generate contextual summary (first 200 chars of meaningful content)
    const summary = content.slice(0, 200).trim() + (content.length > 200 ? '...' : '');

    // Extract key topics (simple keyword extraction)
    const keyTopics = extractKeyTopics(content, title);

    // Generate smart questions based on content type and content
    const suggestedQuestions = generateSmartQuestions(contentType, title, content, keyTopics);

    return {
      title,
      url,
      contentType,
      summary,
      keyTopics,
      suggestedQuestions
    };
  };

  const extractKeyTopics = (content: string, title: string): string[] => {
    const text = (title + ' ' + content).toLowerCase();
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'a', 'an']);
    
    // Extract words that appear multiple times and are longer than 3 chars
    const words = text.match(/\b\w{4,}\b/g) || [];
    const wordCount = new Map<string, number>();
    
    words.forEach(word => {
      if (!commonWords.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });

    // Return top 5 most frequent words
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  };

  const generateSmartQuestions = (
    contentType: PageContext['contentType'], 
    title: string, 
    content: string, 
    keyTopics: string[]
  ): string[] => {
    const baseQuestions = [];

    switch (contentType) {
      case 'article':
        baseQuestions.push(
          "What are the main points of this article?",
          "Can you summarize this article in 3 key takeaways?",
          "What's the author's main argument here?"
        );
        break;
      case 'tutorial':
        baseQuestions.push(
          "What are the steps outlined in this tutorial?",
          "Can you explain this process more simply?",
          "What prerequisites do I need for this tutorial?"
        );
        break;
      case 'news':
        baseQuestions.push(
          "What's the main news story here?",
          "Who are the key people involved?",
          "What's the impact of this news?"
        );
        break;
      case 'product':
        baseQuestions.push(
          "What are the key features of this product?",
          "What are the pros and cons?",
          "How does this compare to alternatives?"
        );
        break;
      case 'documentation':
        baseQuestions.push(
          "Can you explain this documentation?",
          "What are the key concepts here?",
          "How do I implement this?"
        );
        break;
      case 'social':
        baseQuestions.push(
          "What's this video/post about?",
          "Can you summarize the main content?",
          "What are the key discussions happening?"
        );
        break;
      default:
        baseQuestions.push(
          "What is this page about?",
          "Can you summarize the main content?",
          "What are the key points here?"
        );
    }

    // Add topic-specific questions
    if (keyTopics.length > 0) {
      baseQuestions.push(`Tell me more about ${keyTopics[0]}`);
      if (keyTopics.length > 1) {
        baseQuestions.push(`How does ${keyTopics[0]} relate to ${keyTopics[1]}?`);
      }
    }

    return baseQuestions.slice(0, 4); // Return max 4 suggestions
  };

  const getContentTypeIcon = (type: PageContext['contentType']): string => {
    switch (type) {
      case 'article': return '📄';
      case 'tutorial': return '📚';
      case 'news': return '📰';
      case 'product': return '🛍️';
      case 'documentation': return '📖';
      case 'social': return '🎬';
      case 'search': return '🔍';
      default: return '🌐';
    }
  };

  const getContentTypeLabel = (type: PageContext['contentType']): string => {
    switch (type) {
      case 'article': return 'Article';
      case 'tutorial': return 'Tutorial';
      case 'news': return 'News';
      case 'product': return 'Product';
      case 'documentation': return 'Documentation';
      case 'social': return 'Social Media';
      case 'search': return 'Search Results';
      default: return 'Web Page';
    }
  };

  useEffect(() => {
    if (isVisible) {
      setIsAnalyzing(true);
      const timer = setTimeout(async () => {
        try {
          const context = await analyzePageContent();
          setPageContext(context);
        } catch (error) {
          console.error('Error analyzing page content:', error);
          // Fallback context
          setPageContext({
            title: document.title,
            url: window.location.href,
            contentType: 'general',
            summary: 'Ready to chat about this page.',
            keyTopics: [],
            suggestedQuestions: [
              "What is this page about?",
              "Can you summarize the main content?",
              "What are the key points here?",
              "Help me understand this better"
            ]
          });
        } finally {
          setIsAnalyzing(false);
        }
      }, 500); // Small delay to avoid blocking UI

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        ...themedStyles.explanation,
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '12px',
        border: `1px solid ${currentTheme === "dark" ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        background: currentTheme === "dark" ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
      }}
    >
      {/* Header */}
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <motion.div
          style={{
            fontSize: fontSizes.welcome.emoji,
            marginRight: '12px',
            color: currentTheme === "dark" ? '#fff' : '#000'
          }}
        >
          🤖
        </motion.div>
        <motion.h2
          style={{
            fontSize: fontSizes.welcome.heading,
            fontWeight: 600,
            margin: 0,
            color: currentTheme === "dark" ? '#fff' : '#000'
          }}
        >
          Chat with this page
        </motion.h2>
      </motion.div>

      {/* Page Context */}
      {isAnalyzing ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            background: currentTheme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '8px',
            marginBottom: '16px'
          }}
        >
          <div style={{ 
            width: '20px', 
            height: '20px', 
            border: `2px solid ${currentTheme === "dark" ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
            borderTop: `2px solid ${currentTheme === "dark" ? '#fff' : '#000'}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '12px'
          }} />
          <span style={{
            fontSize: fontSizes.welcome.description,
            color: currentTheme === "dark" ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
          }}>
            Analyzing page content...
          </span>
        </motion.div>
      ) : pageContext && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Page Type Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '8px 12px',
            background: currentTheme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '20px',
            width: 'fit-content'
          }}>
            <span style={{ marginRight: '8px', fontSize: '16px' }}>
              {getContentTypeIcon(pageContext.contentType)}
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: currentTheme === "dark" ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'
            }}>
              {getContentTypeLabel(pageContext.contentType)}
            </span>
          </div>

          {/* Quick Summary */}
          {pageContext.summary && (
            <motion.p
              style={{
                fontSize: fontSizes.welcome.description,
                color: currentTheme === "dark" ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                lineHeight: '1.5',
                marginBottom: '16px',
                fontStyle: 'italic'
              }}
            >
              "{pageContext.summary}"
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Suggested Questions */}
      {pageContext && pageContext.suggestedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            Try asking:
          </motion.p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {pageContext.suggestedQuestions.map((question, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQuestionClick(question)}
                style={{
                  padding: '10px 14px',
                  background: currentTheme === "dark" ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${currentTheme === "dark" ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: currentTheme === "dark" ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontWeight: 400
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === "dark" ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = currentTheme === "dark" ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
                }}
              >
                💬 {question}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add spinning animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default PageContextWelcome; 