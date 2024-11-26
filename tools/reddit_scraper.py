"""Script for scraping Reddit content without using the official API.

Credit:
    https://medium.com/@MinatoNamikaze02/you-dont-need-the-reddit-api-to-acquire-its-data-here-s-how-41ef8f15e1db
"""

import json
import os
import random
import time
from datetime import datetime

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.safari.options import Options
from selenium.webdriver.safari.service import Service


class ScrapeReddit:
    """Handle Reddit content scraping operations using Selenium and BeautifulSoup."""

    def __init__(self, subreddit):
        """Initialize the Reddit scraper with target subreddit.

        Args:
            subreddit (str): Name of the subreddit to scrape

        """
        # Configure Selenium WebDriver
        options = Options()
        self.driver = webdriver.Safari(service=Service(executable_path='/usr/bin/safaridriver'), options=options)
        self.subreddit = subreddit
        self.postids = []
        self.jsons = []

    def lazy_scroll(self):
        """Scroll to the bottom of the subreddit page."""
        current_height = self.driver.execute_script('return document.body.scrollHeight')
        while True:
            self.driver.execute_script('window.scrollTo(0, document.body.scrollHeight);')
            time.sleep(2)
            new_height = self.driver.execute_script('return document.body.scrollHeight')
            if new_height == current_height:
                break
            current_height = new_height
        return self.driver.page_source

    def get_posts(self):
        """Scrapes post IDs from the subreddit."""
        url = f'https://www.reddit.com/r/{self.subreddit}/top/?t=month'
        self.driver.get(url)
        time.sleep(5)  # Allow the page to load
        html = self.lazy_scroll()
        parser = BeautifulSoup(html, 'html.parser')
        post_links = parser.find_all('a', {'slot': 'full-post-link'})
        print(f"Found {len(post_links)} posts.")

        for post_link in post_links:
            post_id = post_link['href'].split('/')[-3]
            if post_id not in self.postids:
                self.postids.append(post_id)

    def get_data(self, postid):
        """Fetch JSON metadata for a given post ID."""
        base_url = "https://reddit.com/"
        url = f"{base_url}{postid}.json"
        self.driver.get(url)
        time.sleep(3)  # Allow the page to load
        html = self.driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        return soup.find('body').get_text()

    def get_post_details(self):
        """Fetch metadata for all collected post IDs."""
        if not self.postids:
            print("No post IDs found. Please run get_posts() first.")
            return

        for count, postid in enumerate(self.postids, 1):
            print(f"Fetching post {count}/{len(self.postids)}: {postid}")
            try:
                text = self.get_data(postid)
                self.jsons.append(text)
                time.sleep(random.randint(1, 10))  # Prevent IP blacklisting
            except Exception as e:
                print(f"Error fetching post {postid}: {e}")

    @staticmethod
    def get_post_info(json_data):
        """Extract details from the JSON data."""
        post = json_data[0]['data']['children'][0]['data']
        post_body = post['title']
        post_user = post['author']
        post_time = post['created_utc']
        comments = json_data[1]['data']['children']
        comments_list = []

        for comment in comments:
            comment_data = comment['data']
            comment_body = comment_data.get('body', '[deleted]')
            comment_user = comment_data.get('author', '[deleted]')
            comment_time = comment_data.get('created_utc', 0)
            replies = []

            if comment_data.get('replies'):
                replies_data = comment_data['replies']['data']['children']
                for reply in replies_data:
                    reply_data = reply['data']
                    reply_body = reply_data.get('body', '[deleted]')
                    reply_user = reply_data.get('author', '[deleted]')
                    reply_time = reply_data.get('created_utc', 0)
                    replies.append({'body': reply_body, 'user': reply_user, 'time': reply_time})

            comments_list.append({
                'body': comment_body,
                'user': comment_user,
                'time': comment_time,
                'replies': replies
            })

        return {
            'post_body': post_body,
            'post_user': post_user,
            'post_time': post_time,
            'comments': comments_list
        }

    def parse_jsons(self):
        """Parse saved JSON data."""
        results = []
        for data in self.jsons:
            try:
                parsed_json = json.loads(data)
                results.append(self.get_post_info(parsed_json))
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")
        return results

    @staticmethod
    def save_to_json(data, subreddit):
        """Save data to a JSON file."""
        timestamp = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
        filename = f'data/{subreddit}/{timestamp}.json'
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Data saved to {filename}")

    def destroy(self):
        """Close the Selenium WebDriver."""
        self.driver.close()

# Main Script Execution
if __name__ == '__main__':
    subreddit = 'greentexts'
    scraper = ScrapeReddit(subreddit)

    try:
        print("Getting posts...")
        scraper.get_posts()
        print(f"Found {len(scraper.postids)} posts.")

        print("Fetching post details...")
        scraper.get_post_details()

        print("Parsing JSON data...")
        parsed_data = scraper.parse_jsons()

        print("Saving data...")
        scraper.save_to_json(parsed_data, subreddit)

    finally:
        scraper.destroy()
